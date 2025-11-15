
export interface spData{
    name : string,
    photo : string,
    email : string,
    phone_number : string,
    password : string,
    role ?: number | string,
}

export interface  Admin{
    email: {
        email: string;
    };
    role: {
        name: string;
    };
}
export  interface EbookData {
    Title: string;
    "Published Year": string;
    "Number of Pages": number;
    Description: string;
    "Cover Photo": string;
    "Book PDF": string;
    Type: string;
    Author: string;
    Category: string;
    Level: string
    [key: string]: any;
}