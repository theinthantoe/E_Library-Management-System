import {Request,Response,NextFunction} from "express";

export const parsePagination=(req:Request, res:Response,next:NextFunction)=>{
    let {page,limit} = (req as any).query;
    page  = parseInt(page,10)
    limit = parseInt(limit,10)
    if(!page || page <= 0 ) page =1;
    if(!limit || limit <=0) limit =10
    const offset = (page - 1) * limit;
    (req as any).pagination = {page, limit, offset};
    next()

}

function validateMaxNumber (number:number,max :number){
    if (number < 0) return  0;
    if(number < max) return  max;
    return max;
}

export const builderPagination = (total:number,offset:number,limit:number)=>{

    const currentPage = offset / limit + 1;
    const totalPages = Math.ceil(total / limit);
    const itemFrom = validateMaxNumber((currentPage - 1) * limit + 1, total);
    const itemTo = validateMaxNumber(currentPage * limit, total);

    return {
        totalItems: total,
        totalPages,
        itemFrom,
        itemTo,
        currentPage,
        limit,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        previousPage: currentPage > 1 ? currentPage - 1 : null,
    }
}