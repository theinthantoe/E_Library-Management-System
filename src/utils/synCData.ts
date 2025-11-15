import mongoose from "mongoose";
import { EBook } from "../models/Ebook"; // Ensure this is your eBook model
import { Package } from "../models/Package";

/**
 * Fetch and return data to sync from the main database in JSON format.
 * @param {object} customer The customer object containing user and package information.
 * @returns {Promise<object>} The data to sync in JSON format.
 */
export async function fetchSyncData(customer   : any): Promise<{ success: boolean; message: string; data: any }> {
    try {
        // Validate customer input
        if (!customer || !customer.email || !customer.packageId) {
            throw new Error("Invalid customer data. Email and packageId are required.");
        }

        console.log(`Fetching data to sync for customer: ${customer.email}`);
        console.log(customer,"hello")

        const {packageId} = customer;
        // Step 1: Fetch package details
        const packageDetails = await Package.findById(packageId).lean();
        if (!packageDetails) throw new Error("Package not found for the customer.");

        const { data, name } = packageDetails;
        console.log(`Package "${name}" includes: ${data.join(", ")}`);

        // Step 2: Initialize sync data
        const syncData: any = {};

        // Fetch eBooks if "ebooks" is included in package data
        if (data.includes("ebooks")) {
            console.log("Fetching eBooks...");
            syncData.ebooks = await EBook.find({}).populate("author ebookCategory ebookLevel").lean(); // Adjust limit as needed
        }



        return syncData;
    } catch (error: any) {
        console.error("Error fetching data for sync:", error.message);
        return {
            success: false,
            message: error.message,
            data: null,
        };
    }
}
