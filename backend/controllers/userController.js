import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";

//create token
const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET);
}

//login user
const loginUser = async (req,res) => {
    const {email, password} = req.body;
    try{
        const user = await userModel.findOne({email})

        if(!user){
            return res.json({success:false,message: "User does not exist"})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            return res.json({success:false,message: "Invalid credentials"})
        }

        const token = createToken(user._id)
        res.json({success:true,token,role:user.role,name:user.name})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

//register user
const registerUser = async (req,res) => {
    const {name, email, password, phone} = req.body;
    try{
        //check if user already exists
        const exists = await userModel.findOne({email})
        if(exists){
            return res.json({success:false,message: "User already exists"})
        }

        // validating email format & strong password
        if(!validator.isEmail(email)){
            return res.json({success:false,message: "Please enter a valid email"})
        }
        if(password.length<8){
            return res.json({success:false,message: "Please enter a strong password"})
        }
        // optional Indian mobile
        let cleanPhone;
        if (phone) {
            cleanPhone = String(phone).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
            if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                return res.json({success:false,message: "Please enter a valid 10-digit Indian mobile number"})
            }
            const phoneTaken = await userModel.findOne({ phone: cleanPhone });
            if (phoneTaken) {
                return res.json({success:false,message: "Mobile number already registered"})
            }
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({name, email, password: hashedPassword, ...(cleanPhone ? { phone: cleanPhone } : {})})
        const user = await newUser.save()
        const token = createToken(user._id)
        res.json({success:true,token})

    } catch(error){
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {loginUser, registerUser}

// saved delivery address — GET returns, POST saves (autofill next order)
const getAddress = async (req, res) => {
    try {
        const user = await userModel.findById(req.body.userId).select("savedAddress addresses");
        // migrate old single address into list once
        let list = user?.addresses || [];
        if (list.length === 0 && user?.savedAddress?.street) {
            list = [{ ...user.savedAddress.toObject(), label: "Home", lastUsedAt: new Date() }];
        }
        res.json({ success: true, address: user?.savedAddress || {}, addresses: list });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const saveAddress = async (req, res) => {
    try {
        const { street, city, state, zipcode, country, landmark } = req.body;
        await userModel.findByIdAndUpdate(req.body.userId, {
            savedAddress: {
                street: String(street || "").slice(0, 500),
                city: String(city || "Lucknow").slice(0, 100),
                state: String(state || "Uttar Pradesh").slice(0, 100),
                zipcode: String(zipcode || "").slice(0, 20),
                country: String(country || "India").slice(0, 100),
                landmark: String(landmark || "").slice(0, 200)
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { getAddress, saveAddress };

// ---- multiple addresses: address1, address2... (last used first) ----
const cleanAddr = (b) => ({
    label: String(b.label || "").slice(0, 30),
    street: String(b.street || "").slice(0, 500),
    city: String(b.city || "Lucknow").slice(0, 100),
    state: String(b.state || "Uttar Pradesh").slice(0, 100),
    zipcode: String(b.zipcode || "").slice(0, 20),
    country: String(b.country || "India").slice(0, 100),
    landmark: String(b.landmark || "").slice(0, 200),
    lat: b.lat != null ? Number(b.lat) : null,
    lng: b.lng != null ? Number(b.lng) : null,
    lastUsedAt: new Date()
});

// GET /api/user/addresses — sorted last-used first
const listAddresses = async (req, res) => {
    try {
        const user = await userModel.findById(req.body.userId).select("addresses");
        const list = [...(user?.addresses || [])].sort(
            (a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt)
        );
        res.json({ success: true, data: list });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// POST /api/user/addresses — add (max 5)
const addAddress = async (req, res) => {
    try {
        const user = await userModel.findById(req.body.userId);
        if (!user) return res.json({ success: false, message: "Error" });
        if (user.addresses.length >= 5) {
            return res.json({ success: false, message: "Max 5 addresses" });
        }
        user.addresses.push(cleanAddr(req.body));
        // also keep legacy single field in sync
        user.savedAddress = { ...cleanAddr(req.body) };
        await user.save();
        res.json({ success: true, data: user.addresses });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// PUT /api/user/addresses/:id — edit (also marks last used)
const updateAddress = async (req, res) => {
    try {
        const user = await userModel.findById(req.body.userId);
        const a = user?.addresses.id(req.params.id);
        if (!a) return res.json({ success: false, message: "Not found" });
        Object.assign(a, cleanAddr({ ...a.toObject(), ...req.body }));
        user.savedAddress = { ...cleanAddr(a.toObject()) };
        await user.save();
        res.json({ success: true, data: user.addresses });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// DELETE /api/user/addresses/:id
const deleteAddress = async (req, res) => {
    try {
        const user = await userModel.findById(req.body.userId);
        user.addresses.pull({ _id: req.params.id });
        await user.save();
        res.json({ success: true, data: user.addresses });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// POST /api/user/addresses/use/:id — mark last used (switch address)
const useAddress = async (req, res) => {
    try {
        const user = await userModel.findById(req.body.userId);
        const a = user?.addresses.id(req.params.id);
        if (!a) return res.json({ success: false, message: "Not found" });
        a.lastUsedAt = new Date();
        user.savedAddress = { ...cleanAddr(a.toObject()) };
        await user.save();
        res.json({ success: true, data: a });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { listAddresses, addAddress, updateAddress, deleteAddress, useAddress };