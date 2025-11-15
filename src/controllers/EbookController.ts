import { Request, Response, NextFunction } from "express";
import { EBook } from "../models/Ebook";
import  {Author} from "../models/Author";
import {EbookCategory} from "../models/EbookCategory";
import {EbookLevel} from "../models/EbookLevel";
import BaseController from "./BaseController";
import {EbookData} from "../interface/auth"
import {logAction} from "../middlewares/auth.middleware";
import {Messages} from "../utils/Messages";
import {s3UploadImage,s3DelImage,parseCSV,parseExcel} from "../service/awsService";
import path from "path";
import {builderPagination} from "../helpers/pagination";

class EbookController extends BaseController {
    constructor() {
        super();
        this.createEbook = this.createEbook.bind(this);
        this.getAllEbooks = this.getAllEbooks.bind(this);
        this.getEbookById = this.getEbookById.bind(this);
        this.updateEbook = this.updateEbook.bind(this);
        this.deleteEbook = this.deleteEbook.bind(this);
        this.getByYear = this.getByYear.bind(this);
        this.bulkUpload = this.bulkUpload.bind(this);
    }

    // Create a new Ebook
    async createEbook(req: Request, res: Response, next: NextFunction)  {
        try {
            const user = (req as any).user;

            if (!user) {
                this.responseNotFound(res,Messages.unauthorized);
            }
            // Access uploaded files
            const coverFile = (req as any).files.cover[0]; // Cover image
            const bookFile = (req as any).files.book[0]; // Book PDF

            // Check if files are uploaded
            if (!coverFile || !bookFile) {
                this.responseNotFound(res,Messages.ebook);
            }

            // Upload cover image to S3
            const coverKey = `books/book_covers/cover_${Date.now()}_${coverFile.originalname}`;
            await s3UploadImage(coverFile.buffer, coverFile.mimetype, coverKey);
            const coverUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${coverKey}`;

            // Upload book file to S3
            const bookKey = `books/book_pdfs/book_${bookFile.originalname}`;
            await s3UploadImage(bookFile.buffer, bookFile.mimetype, bookKey);
            const bookUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${bookKey}`;

            // Prepare eBook data
            const eBookData = {
                title: req.body.title,
                publish_year : req.body.publish_year,
                number_of_pages : req.body.number_of_pages,
                description : req.body.description,
                cover_photo: coverUrl, // Store S3 URL for the cover image
                book_pdf: bookUrl,       // Store S3 URL for the book PDF
                type: req.body.type.toLowerCase(),
                author : req.body.author,
                ebookCategory : req.body.ebookCategory,
                ebookLevel : req.body.ebookLevel

            };

            // console.log(eBookData);

            // Save eBook to database
            const newEbook : any = await EBook.create(eBookData);

            const author : any = await Author.findById(newEbook.author);
            if (!author) {
                this.responseError(res,Messages.notFound)
            }

            // Push the new eBook's _id into the Author's eBooks array
            author.eBooks.push(newEbook._id);

            // Save the Author document
            await author.save();
            // Log the action
            await logAction(
                `created a new ebook titled "${req.body.title}"`,
                "create",
                req
            );
            this.respondCreated(res, newEbook,Messages.created);

        } catch (error) {
            console.error('Error creating eBook:', error);
            next(error);
        }
    }


    // Read all Ebooks
    async getAllEbooks(req: Request, res: Response, next: NextFunction) {
        try {
            const {page,limit,offset} = (req as any).pagination;
            const { type, category, bookLevel, publishYear, rating, search, author, startDate, endDate } =  (req as any).query;

            const filters : any = {};
            if (type) {
                if (!['english', 'myanmar'].includes(type)) {
                    this.responseBadRequest(res,{ message: "Invalid type. Allowed values are 'english' or 'myanmar'." });
                }
                filters.type = type;
            }

            if (category) {
                const categoriesArray = category.split(',');
                filters.ebookCategory = { $in: categoriesArray };
            }
            if (rating) {
                // Parse ratings into an array and filter by `$in`
                const ratingsArray = rating.split(',').map(Number);
                filters.rating = { $in: ratingsArray };
            }
            if (search) {
                const regex = new RegExp(search, 'i'); // Case-insensitive search
                filters.$or = [
                    { title: regex },
                    { description: regex }, // Add fields as needed
                ];
            }
            if (bookLevel) {
                const levelsArray = bookLevel.split(',');
                filters.ebookLevel = { $in: levelsArray };
            }
            if (publishYear) {
                const yearsArray = publishYear.split(',').map(Number);
                filters.publish_year = { $in: yearsArray };

            }
            if(author){
                filters.author = author;
            }

            // Apply date range filter
            if (startDate || endDate) {
                filters.createdAt = {};

                // If startDate is provided, apply it as the start date of the filter
                if (startDate) {
                    filters.createdAt.$gte = new Date(new Date(startDate).toISOString()); // Ensure UTC
                }

                // If endDate is provided, apply it as the end date of the filter (end of the day)
                if (endDate) {
                    // Adjust endDate to be the end of the day (23:59:59.999) instead of midnight
                    const endOfDay = new Date(endDate);
                    endOfDay.setHours(23, 59, 59, 999); // Set to the very last millisecond of the day
                    filters.createdAt.$lte = endOfDay;
                }
            }

            const ebooks = await EBook.find(filters).sort({ createdAt : -1}).limit(limit).skip(offset)
                .populate('author ebookLevel ebookCategory')
            const totalCounts = await EBook.countDocuments(filters);
            const pagination = builderPagination(totalCounts,offset,limit)
            this.respondSuccessWithPaginator(res, ebooks,pagination,Messages.DATA_LIST);
        } catch (error) {
            next(error);
        }
    }

    // Read a single Ebook by ID
    async getEbookById(req: Request, res: Response, next: NextFunction){
        try {
            const { id } = req.params;
            const ebook = await EBook.findById(id).populate('author ebookLevel ebookCategory');
            if (!ebook) {
                this.responseNotFound(res,Messages.notFound)
            }
            this.respondSuccess(res, ebook,Messages.getOne);
        } catch (error) {
            next(error);
        }
    }

    // Update an Ebook by ID
    async updateEbook(req : Request, res : Response ,next: NextFunction){
        const { id } = req.params;

        try {
            const existingEbook : any = await EBook.findById(id);
            if (!existingEbook) {
                this.responseNotFound(res,Messages.notFound)
            }

            let coverUrl = existingEbook.cover_photo;
            let bookUrl = existingEbook.book_pdf;

            // Check for uploaded files and update accordingly
            if (req.files && (req as any).files.cover) {
                const coverFile = (req as any).files.cover[0];
                const coverKey = `books/book_covers/cover_${coverFile.originalname}`;
                await s3UploadImage(coverFile.buffer, coverFile.mimetype, coverKey);
                coverUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${coverKey}`;
                if (existingEbook.cover_photo) {
                    console.log(existingEbook.cover_photo);
                    await s3DelImage(existingEbook.cover_photo);
                }
            }

            if (req.files && (req as any).files.book) {
                const bookFile = (req as any).files.book[0];
                const bookKey = `books/book_pdfs/book_${bookFile.originalname}`;
                await s3UploadImage(bookFile.buffer, bookFile.mimetype, bookKey);
                bookUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${bookKey}`;
                if (existingEbook.book_pdf) {
                    console.log(existingEbook.book_pdf);
                    await s3DelImage(existingEbook.book_pdf);
                }
            }



            // Update only the fields present in the request body
            const updatedEbookData = {
                title: req.body.title || existingEbook.title,
                publish_year: req.body.publish_year || existingEbook.publish_year,
                number_of_pages: req.body.number_of_pages || existingEbook.number_of_pages,
                description: req.body.description !== undefined ? req.body.description : existingEbook.description,
                cover_photo: coverUrl,
                book_pdf: bookUrl,
                rating: req.body.rating || existingEbook.rating,
                view_count: req.body.view_count || existingEbook.view_count,
                type: req.body.type|| existingEbook.type,
                author: req.body.author || existingEbook.author,
                ebookCategory: req.body.ebookCategory || existingEbook.ebookCategory,
                ebookLevel: req.body.ebookLevel || existingEbook.ebookLevel,

            };

            const updatedEbook : any= await EBook.findByIdAndUpdate(
                id,
                updatedEbookData,
                { new: true }
            ).populate("author ebookCategory ebookLevel");

            await logAction(
                ` updated  ${updatedEbook.title}`,
                'update',
                req
            );
            this.respondSuccess(res,updatedEbook,Messages.updated);

        } catch (error) {
            console.error("Error updating ebook:", error);
            next(error);
        }
    }

    //Get By Year

    async getByYear(req: Request, res: Response, next: NextFunction) {
        try{
            const publishYears = await EBook.distinct('publish_year')
            this.respondSuccess(res,publishYears,Messages.DATA_LIST)
        }catch(error){
            next(error)
        }
    }

    // Delete an Ebook by ID
    async deleteEbook(req: Request, res: Response, next: NextFunction){
        try {
            const { id } = req.params;
            const deletedEbook :any = await EBook.findByIdAndDelete(id);

            if (!deletedEbook) {
                this.responseNotFound(res,Messages.notFound)
            }

            this.respondSuccess(res,deletedEbook,Messages.deleted);
            await logAction(
                `deleted a new ebook titled "${deletedEbook.title}"`,
                "delete",
                req
            );

        } catch (error) {
            next(error);
        }
    }
    async bulkUpload(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                this.responseBadRequest(res, Messages.NO_FILE);
                return;
            }

            const fileExtension = path.extname((req as any).file.originalname).toLowerCase();
            let eBooksData: EbookData[] = []; // Explicitly type this as EbookData[]

            // Parse the uploaded CSV or Excel file
            if (fileExtension === ".csv") {
                eBooksData = await parseCSV((req as any).file.buffer) as EbookData[];
            } else if (fileExtension === ".xlsx") {
                eBooksData = await parseExcel((req as any).file.buffer) as EbookData[];
            } else {
                this.responseBadRequest(res, Messages.File_Format);
                return;
            }

            // Fetch categories, levels, authors, and existing eBooks from DB
            const categories = await EbookCategory.find();
            const levels = await EbookLevel.find();
            const authors = await Author.find();
            const existingEBooks = await EBook.find().select('title').lean();

            // Create case-insensitive maps for categories, levels, authors, and existing eBooks
            const categoryMap: Record<string, string> = categories.reduce((map, category) => {
                map[category.name.toLowerCase()] = category._id.toString();
                return map;
            }, {} as Record<string, string>);
            console.log(categoryMap,'categories')

            const levelMap: Record<string, string> = levels.reduce((map, level) => {
                map[level.name.toLowerCase()] = level._id.toString();
                return map;
            }, {} as Record<string, string>);
            console.log("Level Map:", levelMap);

            const authorMap: Record<string, string> = authors.reduce((map, author) => {
                map[author.name.toLowerCase()] = author._id.toString();
                return map;
            }, {} as Record<string, string>);

            const existingEBookNames = new Set(existingEBooks.map(eBook => eBook.title.toLowerCase()));

            // Filtered and valid eBooks for saving
            const validEbooks = [];
            const invalidEbooks = [];
            const duplicateEBooks = [];

            // Process each eBook in the data
            for (const ebook of eBooksData) {
                const normalizedEbook: Record<string, any> = {};
                const baseUrl = "https://obselibrarymain.s3.ap-southeast-1.amazonaws.com/";

                for (const key of Object.keys(ebook)) {
                    const normalizedKey = key.trim().replace(/\s+/g, " ");
                    normalizedEbook[normalizedKey] = ebook[key];
                }

                // console.log(normalizedEbook,"normalizedEbook");


                // Trim spaces from levelMap keys to ensure no mismatches
                const trimmedLevelMap = Object.fromEntries(
                    Object.entries(levelMap).map(([key, value]) => [key.trim().toLowerCase(), value])
                );

                const trimmedCategoryMap = Object.fromEntries(
                    Object.entries(categoryMap).map(([key, value]) => [key.trim().toLowerCase(), value])
                );

                const newEbookData = {
                    title: normalizedEbook.Title?.trim(),
                    publish_year: normalizedEbook["Published Year"],
                    number_of_pages: normalizedEbook["Number of Pages"]
                        ? parseInt(normalizedEbook["Number of Pages"], 10)
                        : 0,
                    description: normalizedEbook.Description?.trim() || "",
                    cover_photo: `${baseUrl}${normalizedEbook["Cover Photo"]?.trim()}`,
                    book_pdf: `${baseUrl}${normalizedEbook["Book PDF"]?.trim()}`,
                    type: normalizedEbook.Type?.toLowerCase() || "",
                    author: authorMap[normalizedEbook.Author?.toLowerCase()] || null,
                    ebookCategory: trimmedCategoryMap[normalizedEbook.Category?.trim().toLowerCase()] || null,
                    ebookLevel: trimmedLevelMap[normalizedEbook.Level?.trim().toLowerCase()] || null,  // Trim both
                };

                // console.log("Mapped eBook Data:", newEbookData);



                // Check if the eBook title already exists
                if (newEbookData.title && existingEBookNames.has(newEbookData.title.toLowerCase())) {
                    duplicateEBooks.push({
                        title: newEbookData.title,
                        message: `Duplicate eBook title found: ${newEbookData.title}`,
                    });
                    continue; // Skip this eBook
                }

                // Validation to check if required fields are missing
                const missingFields: string[] = [];
                if (!newEbookData.title) missingFields.push('Title');
                if (!newEbookData.publish_year) missingFields.push('Published Year');
                if (!newEbookData.number_of_pages) missingFields.push('Number of Pages');
                // if (!newEbookData.description) missingFields.push('Description');
                if (!newEbookData.cover_photo) missingFields.push('Cover Photo');
                if (!newEbookData.book_pdf) missingFields.push('Book PDF');
                if (!newEbookData.author) missingFields.push('Author');
                if (!newEbookData.ebookCategory) missingFields.push('Category');
                if (!newEbookData.ebookLevel) missingFields.push('Level');

                if (missingFields.length > 0) {
                    invalidEbooks.push({
                        title: ebook.Title,
                        message: `Skipping eBook: ${ebook.Title} is missing fields: ${missingFields.join(", ")}`,
                    });
                    continue;
                }

                validEbooks.push(newEbookData);
            }

            // If there are no valid eBooks to save, return an error
            if (validEbooks.length === 0) {
                this.responseBadRequest(
                    res,
                    { invalidEbooks, duplicateEBooks },
                    Messages.invalid_book
                );
                return;
            }

            // Save all valid eBooks to the database
            const savedEbooks = await EBook.insertMany(validEbooks);

            await logAction('create bulk upload', 'create', req);

            // After saving, associate the eBooks with their authors
            for (const savedEbook of savedEbooks) {
                const authorId = savedEbook.author;
                if (authorId) {
                    const author = await Author.findById(authorId);
                    if (author) {
                        author.eBooks.push(savedEbook._id);
                        await author.save();
                    }
                }
            }

            this.respondBulkUploadCreated(
                res,
                { savedEbooks, invalidEbooks, duplicateEBooks },
                Messages.created
            );
        } catch (error) {
            console.error('Error during bulk upload:', error);
            next(error);
        }
    }


}



export default EbookController;