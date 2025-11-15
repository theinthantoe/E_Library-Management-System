import { Application } from "express";
import AuthRoutes from "./auth/auth.routes"
import EbookRoutes from "./ebook/ebook.routes";
import EbookLevelRoutes from "./ebookLevel/ebookLevel.routes"
import  EbookCategoryRoutes from "./ebookCategory/ebookCategory.routes"
import packageRoutes from "./package/package.routes"
import authorRoutes from "./author/author.routes";
import reportRoutes from "./logs/logs.routes"
import customerRoutes from "./customer/customer.routes"
import smtpRoutes from "./smtp/smtp.routes"
const PREFIX_ROUTE = '/api'
const PREFIX_ROUTE_MOBILE = '/mobile/api'

export default class Routes {
    constructor(app:Application){
        app.use(`${PREFIX_ROUTE}/auth`,AuthRoutes)
        app.use(`${PREFIX_ROUTE}/ebook`,EbookRoutes)
        app.use(`${PREFIX_ROUTE}/ebook-level`, EbookLevelRoutes)
        app.use(`${PREFIX_ROUTE}/ebook-category`, EbookCategoryRoutes)
        app.use(`${PREFIX_ROUTE}/package`,packageRoutes)
        app.use(`${PREFIX_ROUTE}/author`, authorRoutes)
        app.use(`${PREFIX_ROUTE}/reports`, reportRoutes)
        app.use(`${PREFIX_ROUTE}/customer`, customerRoutes)
        app.use(`${PREFIX_ROUTE}/smtp`, smtpRoutes)


    }
}