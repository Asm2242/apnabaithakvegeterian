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

// Levenshtein similarity 0..1 for fuzzy dish matching ("Cholee Samosa" -> "Chole Samosa")
const similarity = (a, b) => {
    a = String(a || "");
    b = String(b || "");
    if (a === b) return 1;
    if (!a.length || !b.length) return 0;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return 1 - dp[a.length][b.length] / Math.max(a.length, b.length);
};

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// suggest closest dishes for a filename
const suggestDishes = (fileKey, foods, topN = 3) => {
    return foods
        .map((f) => {
            const nameKey = norm(f.name);
            let score = similarity(fileKey, nameKey);
            // bonus for substring overlap
            if (nameKey.includes(fileKey) || fileKey.includes(nameKey)) score = Math.max(score, 0.6);
            return { id: String(f._id), name: f.name, score: Math.round(score * 100) / 100 };
        })
        .filter((s) => s.score >= 0.35)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
};

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

export { listFood, addFood, updateFood, removeFood, bulkPhotos, bulkConfirm }

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
        // unmatched files -> pending bundle + smart suggestions (spelling mistakes OK)
        let bundleId = null;
        const suggestions = [];
        const pending = entries
            .slice(0, 200)
            .map((e) => path.basename(e.entryName))
            .filter((n) => !updated.some((u) => u.file === n));
        if (pending.length > 0) {
            bundleId = `b${Date.now()}${Math.round(Math.random() * 1e6)}`;
            const dir = path.join("uploads", `tmp-bulk-${bundleId}`);
            fs.mkdirSync(dir, { recursive: true });
            for (const entry of entries.slice(0, 200)) {
                const base = path.basename(entry.entryName);
                if (pending.includes(base)) {
                    fs.writeFileSync(path.join(dir, base), entry.getData());
                }
            }
            for (const file of pending) {
                const key = norm(file.replace(/\.(jpe?g|png|webp)$/i, ""));
                const options = suggestDishes(key, foods, 3);
                suggestions.push({ file, options });
            }
        }
        res.json({
            success: true,
            message: `${updated.length} photos lag gayi, ${pending.length} match nahi hui.`,
            updated,
            unmatched: pending,
            bundleId,
            suggestions
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Zip process fail" });
    }
}

// POST /api/food/bulk-confirm (admin) — accept suggestions: { bundleId, mapping: { filename: dishId } }
const bulkConfirm = async (req, res) => {
    try {
        const { bundleId, mapping } = req.body;
        if (!bundleId || !mapping || typeof mapping !== "object") {
            return res.json({ success: false, message: "bundleId + mapping bhejo" });
        }
        const dir = path.join("uploads", `tmp-bulk-${String(bundleId).replace(/[^a-z0-9]/gi, "")}`);
        if (!fs.existsSync(dir)) {
            return res.json({ success: false, message: "Bundle expire ho gaya. Zip dobara bhejo." });
        }
        const applied = [];
        const failed = [];
        for (const [file, dishId] of Object.entries(mapping)) {
            if (!dishId) continue;
            const safe = path.basename(String(file));
            const full = path.join(dir, safe);
            if (!fs.existsSync(full)) {
                failed.push(file);
                continue;
            }
            const dish = await foodModel.findById(dishId);
            if (!dish) {
                failed.push(file);
                continue;
            }
            try {
                const url = await storeImage({ path: full });
                dish.image = url;
                await dish.save();
                applied.push({ dish: dish.name, file: safe });
            } catch (e) {
                failed.push(file);
            }
            fs.unlink(full, () => {});
        }
        // cleanup bundle dir
        try {
            const left = fs.readdirSync(dir);
            if (left.length === 0) fs.rmdirSync(dir);
        } catch (e) { /* ignore */ }
        res.json({
            success: true,
            message: `${applied.length} photos accept karke laga di.`,
            applied,
            failed
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Confirm fail" });
    }
}