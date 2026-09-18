import foodModel from "../models/foodModel.js";
import fs from 'fs'

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

    let image_filename = `${req.file.filename}`

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
        if (req.file) patch.image = req.file.filename;
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
        fs.unlink(`uploads/${food.image}`, () => { })

        await foodModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "Food Removed" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }

}

export { listFood, addFood, updateFood, removeFood }