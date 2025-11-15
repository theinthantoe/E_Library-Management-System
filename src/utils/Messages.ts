import {any} from "joi";

const Messages = {
    list: "List Data",
    ebook : "Cover image and book file are required.",
    created: "Created Successfully",
    getOne : "Get Detail Data Successfully",
    updated : "Updated Data Successfully",
    deleted : "Deleted Data Successfully",
    delete_level : 'Cannot delete this Level because it is assigned to one or more ebook.',
    delete_package : 'Cannot delete this package because it is assigned to one or more customer.',
    delete_category : 'Cannot delete this Category because it is assigned to one or more ebook.',
    delete_author : 'Cannot delete this Author because it is assigned to one or more ebook.',
    DUPLICATE_FOUND : 'Duplicate FOUND',
    exit : "Already Created",
    notFound : "Not Found Data",
    successLogin:"Login Successfully",
    passwordNoMatch : "Password do not match!",
    NO_FILE :  "No file uploaded",
    File_Format :  "Unsupported file format",
    OTPSuccess  : "OTP Successfully",
    RESEND : "OTP resend successfully",
    EXPIRE_TIME : "OTP has expired",
    INVALID : "Invalid Password",
    VERIFY_OTP  : "verify Otp",
    RESET_PWD : "Reset Password Successfully ",
    unauthorized : "Unauthorized",
    DATA_LIST : "All Data Lists",
    invalid_book :  "No valid eBooks to upload. All eBooks have missing required fields.",
    changePassword : "Changed Password Successfully",
}

export { Messages }