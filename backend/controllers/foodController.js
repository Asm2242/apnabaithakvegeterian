import foodModel from "../models/foodModel.js";
import fs from 'fs'
import path from 'path';
import AdmZip from "adm-zip";
import { v2 as cloudinary } from "cloudinary";

// Permanent photo storage: Cloudinary when keys exist, else local uploads/.
// (Render free disk wipes on every deploy — Cloudinary survives.)
const cloudReady = () =>
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

if (cloudReady()) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// returns stored image value: full Cloudinary URL or local filename
const storeImage = async (file) => {
    if (!file) return "";
    if (cloudReady()) {
        const up = await cloudinary.uploader.upload(file.path, { folder: "apna-baithak" });
        fs.unlink(file.path, () => {});
        return up.secure_url;
    }
    return file.filename;
}

const isRemoteImage = (img) => /^https?:\/\//.test(img || "");

// all food list
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({})
        res.json({ success: true, data: foods })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }

}

// add food
const addFood = async (req, res) => {

    let image_filename = await storeImage(req.file)

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: Number(req.body.price),
        halfPrice: req.body.halfPrice ? Number(req.body.halfPrice) : null,
        fullPrice: req.body.fullPrice ? Number(req.body.fullPrice) : null,
        isPizza: req.body.isPizza === true || req.body.isPizza === "true",
        category: req.body.category,
        image: image_filename,
        isVeg: req.body.isVeg !== false && req.body.isVeg !== "false",
        bestSeller: req.body.bestSeller === true || req.body.bestSeller === "true",
        available: true,
        sortOrder: Number(req.body.sortOrder) || 0,
    })
    try {
        await food.save();
        res.json({ success: true, message: "Food Added" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// update food (price, half/full, availability — admin)
const updateFood = async (req, res) => {
    try {
        const patch = {};
        for (const k of ["name", "description", "category"]) {
            if (req.body[k] !== undefined) patch[k] = req.body[k];
        }
        for (const k of ["price", "halfPrice", "fullPrice", "sortOrder"]) {
            if (req.body[k] !== undefined && req.body[k] !== "") patch[k] = Number(req.body[k]);
        }
        for (const k of ["isPizza", "isVeg", "bestSeller", "available"]) {
            if (req.body[k] !== undefined) {
                patch[k] = req.body[k] === true || req.body[k] === "true";
            }
        }
        if (req.file) patch.image = await storeImage(req.file);
        // clearing half/full back to single price
        if (req.body.clearSizes === true || req.body.clearSizes === "true") {
            patch.halfPrice = null;
            patch.fullPrice = null;
        }
        await foodModel.findByIdAndUpdate(req.body.id, patch);
        res.json({ success: true, message: "Food Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// delete food
const removeFood = async (req, res) => {
    try {

        const food = await foodModel.findById(req.body.id);
        // delete local file only; Cloudinary images are remote URLs
        if (food && !isRemoteImage(food.image)) {
            fs.unlink(`uploads/${food.image}`, () => { })
        }

        await foodModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "Food Removed" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }

}

export { listFood, addFood, updateFood, removeFood, bulkPhotos }

// POST /api/food/bulk-photos (admin) — photos.zip: match filenames to dishes.
// "Paneer-Pizza.jpg" -> Paneer Pizza. Uploads to Cloudinary, updates DB.
const bulkPhotos = async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ success: false, message: "photos.zip file bhejo" });
        }
        const zip = new AdmZip(req.file.buffer);
        const entries = zip.getEntries().filter((e) =>
            !e.isDirectory && /\.(jpe?g|png|webp)$/i.test(e.entryName)
        );
        if (entries.length === 0) {
            return res.json({ success: false, message: "Zip me koi photo nahi mili (jpg/png/webp)" });
        }
        const foods = await foodModel.find({});
        const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const updated = [];
        const unmatched = [];
        for (const entry of entries.slice(0, 200)) {
            const base = path.basename(entry.entryName).replace(/\.(jpe?g|png|webp)$/i, "");
            const key = norm(base);
            const dish = foods.find((f) =>
                norm(f.name) === key ||
                norm(f._id || "") === key ||
                (key.length > 3 && norm(f.name).includes(key)) ||
                (key.length > 3 && key.includes(norm(f.name)))
            );
            if (!dish) {
                unmatched.push(path.basename(entry.entryName));
                continue;
            }
            const tmp = path.join("uploads", `bulk-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`);
            fs.writeFileSync(tmp, entry.getData());
            try {
                const url = await storeImage({ path: tmp });
                dish.image = url;
                await dish.save();
                updated.push({ dish: dish.name, file: path.basename(entry.entryName) });
            } catch (e) {
                unmatched.push(path.basename(entry.entryName) + " (upload fail)");
            }
            fs.unlink(tmp, () => {});
        }
        res.json({
            success: true,
            message: `${updated.length} photos lag gayi, ${unmatched.length} match nahi hui.`,
            updated,
            unmatched
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Zip process fail" });
    }
}