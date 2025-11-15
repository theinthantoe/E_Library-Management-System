import {Author} from '../models/Author';
import {Request, Response,NextFunction} from 'express';
import BaseController from "./BaseController";
import {Messages} from "../utils/Messages";
import {parseCSV, parseExcel, s3DelImage, s3UploadImage} from "../service/awsService";
import * as process from "node:process";
import {builderPagination} from "../helpers/pagination";
import {EBook} from "../models/Ebook";
import path from "path";
import mongoose from "mongoose";
import {logAction} from "../middlewares/auth.middleware";

class AuthorController extends  BaseController{
    constructor() {
        super();
        this.createAuthor = this.createAuthor.bind(this);
        this.getAllAuthors = this.getAllAuthors.bind(this);
        this.getAuthor = this.getAuthor.bind(this);
        this.updateAuthor = this.updateAuthor.bind(this);
        this.deleteAuthor = this.deleteAuthor.bind(this);
        this.bulkUpload = this.bulkUpload.bind(this);
    }
    // Create Author with Image Upload to S3
    async createAuthor(req: Request, res: Response, next: NextFunction){

        const { name, description } = req.body;
        const imageFile : any = req.file;
        let imageUrl: string | undefined;

        try {
            if(imageFile){
                // Generate a unique key for S3
                const imageKey = `Author/${Date.now()}_${imageFile.originalname}`;

                // Upload the image to S3
                await s3UploadImage(imageFile.buffer, imageFile.mimetype, imageKey);

                // Construct the image URL
                imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${imageKey}`;
            }

            // Save the author to the database
            const author : any = new Author({
                name,
                description,
                image: imageUrl,
            });
            await author.save();

            await logAction(
                `created a new author "${author.name}"`,
                "create",
                req
            );

            this.respondCreated(res, author, Messages.created);
        } catch (error) {
            console.error('Error creating author:', error);
            next(error);
        }
    }



    async  getAllAuthors (req: Request, res: Response, next: NextFunction) {
        try {
            // Log registered models to confirm
            console.log("Registered Models:", mongoose.modelNames());

            const { page, limit, offset } = (req as any).pagination;
            const {search} = (req as any).query;
            const filters : any = {};
            if (search) {
                const regex = new RegExp(search, 'i'); // Case-insensitive search
                filters.$or = [
                    { name: regex },
                    // Add fields as needed
                ];
            }
            const authors = await Author.find(filters)
                .sort({createdAt: -1})
                .limit(limit)
                .skip(offset)
                .populate({
                    path: "eBooks", // Ensure this matches the field name in Author schema
                    select: "title rating cover_photo percentageProgress"
                });

            const totalCounts = await Author.countDocuments(filters);
            const pagination = builderPagination(totalCounts, offset,limit);

            const authorData = authors.map(author => {
                const ownedBooks = author.eBooks || [];
                const totalBooks = ownedBooks.length;
                return {
                    authorId: author._id,
                    name: author.name,
                    image: author.image,
                    description: author.description,
                    totalBooks,
                    books: ownedBooks.map((book : any) => ({
                        bookId: book._id,
                        title: book.title,
                        rating: book.rating,
                        coverPhoto: book.cover_photo,
                        percentageProgress: book.percentageProgress,
                    }))
                };
            });

            this.respondSuccessWithPaginator(res, authorData, pagination, Messages.DATA_LIST);
        } catch (error) {
            console.error("Error Handler:", error);
            next(error);
        }
    }
    async getAuthor (req: Request, res: Response, next: NextFunction) {
        try{
            const {id}= req.params;
            const author = await Author.findById(id)
                .populate('eBooks')
            if(!author){
                this.responseNotFound(res,Messages.notFound)
            }
            this.respondSuccess(res,author,Messages.getOne)
        }catch(error){
            next(error);
        }
    }
    async updateAuthor (req: Request, res: Response, next: NextFunction) {
        try{
            const {id} = req.params;
            const existingAuthor : any = await Author.findById(id);
            if(!existingAuthor){
                this.responseNotFound(res,Messages.notFound)
            }
            let imageUrl = existingAuthor.image;
            if(req.file){
                const imageFile  = req.file;
                const imageKey = `Author/${imageFile?.originalname}`;
                await s3UploadImage(imageFile.buffer,imageFile.mimetype,imageKey);
                imageUrl = `https:${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${imageKey}`;
                if(existingAuthor.image){
                    await s3DelImage(existingAuthor.image);
                }
            }
            const updatedAuthor = {
                name : req.body.name || existingAuthor.name,
                image : imageUrl,
                description : req.body.description || existingAuthor.description,
            }
            const author = await  Author.findByIdAndUpdate(id, updatedAuthor , {new : true});
            await logAction(
                `updated an  author  "${updatedAuthor.name}"`,
                "update",
                req
            );
            this.respondSuccess(res,author,Messages.updated)

        }catch(error){
            next(error);
        }
    }
    async deleteAuthor (req: Request, res :Response, next: NextFunction) {
        try{
            const {id} = req.params;
            const ebookWithAuthor : any = await  EBook.countDocuments({author : id});
            if(ebookWithAuthor > 0){
                this.responseBadRequest(res,Messages.delete_author)
                return
            }
            const deletedAuthor = await Author.findByIdAndDelete(id);
            if(!deletedAuthor){
                this.responseNotFound(res,Messages.notFound)
                return
            }
            await logAction(
                `deleted an author"${deletedAuthor.name}"`,
                "delete",
                req
            );
            this.respondSuccess(res,deletedAuthor,Messages.deleted)

        }catch(error){

        next(error);}
    }
    async bulkUpload(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                this.responseBadRequest(res, Messages.NO_FILE);
                return;
            }

            const fileExtension = path.extname((req as any).file.originalname).toLowerCase();
            let authorsData: any[] = []; // Array to hold parsed author data

            // Parse the uploaded CSV or Excel file
            if (fileExtension === ".csv") {
                authorsData = await parseCSV((req as any).file.buffer) as any; // Assuming parseCSV handles the parsing of CSV
            } else if (fileExtension === ".xlsx") {
                authorsData = await parseExcel((req as any).file.buffer) as any; // Assuming parseExcel handles the parsing of Excel
            } else {
                this.responseBadRequest(res, Messages.File_Format); // Respond if unsupported file type
                return;
            }

            const validAuthors = [];
            const invalidAuthors = [];
            const duplicateAuthors = [];

            // Normalize the author data
            const normalizedAuthors = authorsData.map(author => {
                const normalizedAuthor: Record<string, any> = {};
                for (const key of Object.keys(author)) {
                    const normalizedKey = key.trim().replace(/\s+/g, " ");
                    normalizedAuthor[normalizedKey] = author[key];
                }
                return {
                    name: normalizedAuthor.Name?.trim(),
                    image: normalizedAuthor["Image"]?.trim() || "",
                    description: normalizedAuthor.Description?.trim() || " ",
                };
            });

            // Get existing authors from the database
            const existingAuthors = await Author.find({ name: { $in: normalizedAuthors.map(a => a.name) } })
                .select('name')
                .lean();

            const existingAuthorNames = new Set(existingAuthors.map(author => author.name));

            for (const newAuthor of normalizedAuthors) {
                if (!newAuthor.name) {
                    invalidAuthors.push({
                        name: newAuthor.name || "Unknown",
                        message: `Missing required field: Name.`,
                    });
                    continue;
                }

                if (existingAuthorNames.has(newAuthor.name)) {
                    duplicateAuthors.push(newAuthor.name);
                    continue;
                }

                validAuthors.push(newAuthor);
            }

            // If no valid authors exist, return an error
            if (validAuthors.length === 0) {
                this.responseBadRequest(
                    res,
                    {
                        invalidAuthors,
                        duplicateAuthors,
                        message: "No new valid authors to insert.",
                    },
                    Messages.notFound
                );
                return;
            }

            // Save valid authors to the database
            const savedAuthors = await Author.insertMany(validAuthors);

            await logAction(
                "created a new bulk upload",
                "create",
                req
            );

            // Respond with saved and invalid authors
            this.respondBulkUploadCreated(
                res,
                {
                    savedAuthors,
                    invalidAuthors,
                    duplicateAuthors,
                },
                Messages.created
            );
        } catch (error) {
            console.error("Error during bulk upload:", error);
            next(error); // Pass the error to the next middleware (error handler)
        }
    }



}
export default AuthorController;