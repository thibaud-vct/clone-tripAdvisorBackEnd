const express = require("express");
const router = express.Router();
const SHA256 = require("../node_modules/crypto-js/sha256");
const encBase64 = require("../node_modules/crypto-js/enc-base64");
const uid2 = require("../node_modules/uid2");

const User = require("../models/User");
const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/login", async (req, res) => {
    try {
        // On vérifie que le mail à bien la bonne forme
        const regex = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "g");
        if (regex.test(req.fields.email)) {
            // On va rechercher la fiche client avec son email
            const user = await User.findOne({ email: req.fields.email });
            if (user) {
                // On reconstruit le HASH avec le mdp du client
                const hash = SHA256(req.fields.password + user.salt).toString(
                    encBase64
                );
                // On compare le HASH du server avec le HASH reconstruit
                if (hash === user.hash) {
                    res.status(200).json({
                        _id: user._id,
                        token: user.token,
                        favorite: user.favorite,
                    });
                } else {
                    res.status(401).json({
                        message: "Your mail or password is not valide",
                    });
                }
            } else {
                res.status(401).json({
                    message: "Your mail or password is not valide",
                });
            }
        } else {
            res.status(401).json({
                message: "Your mail or password is not valide",
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.post("/signup", async (req, res) => {
    try {
        // On vérifie que le mail à bien la bonne forme
        const regex = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g);
        if (regex.test(req.fields.email) && req.fields.password) {
            // On vérifie que le client existe pas dans la BDD avec son email
            const user = await User.findOne({ email: req.fields.email });
            if (!user) {
                // On génère un numbre aleatoire SALT
                const salt = uid2(64);
                // On génère le SHASH avec le mdp du client
                const hash = SHA256(req.fields.password + salt).toString(
                    encBase64
                );
                // On génère aussi un nombre aleatoire pour les cookie avec un TOKEN
                const token = uid2(64);
                // Création de la fiche client
                const newUser = new User({
                    email: req.fields.email,
                    token: token,
                    hash: hash,
                    salt: salt,
                });
                // Sauvegarde de la fiche client
                await newUser.save();

                res.status(200).json({
                    _id: newUser._id,
                    token: newUser.token,
                });
            } else {
                res.status(400).json({
                    message: "Your mail is already in use",
                });
            }
        } else {
            res.status(400).json({ message: "Your data is not valide" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put("/like/:id", isAuthenticated, async (req, res) => {
    try {
        // We explode the Body object received by key (Destructuring assignment)
        const {
            title,
            description,
            price,
            brand,
            size,
            condition,
            color,
            city,
        } = req.fields;
        // We retrieve the offer to modify in the BDD
        const editOffer = await Offer.findById(req.params.id);
        // If the data to be modified is present, we modify the offer
        if (title && title.length <= 50) {
            editOffer.product_name = title;
        }
        if (description && description.length <= 500) {
            editOffer.product_description = description;
        }
        if (price && price <= 100000) {
            console.log("modifier le prix");
            editOffer.product_price = price;
        }
        // We are looking for the right location of the "key" in Array of "produc_details" to modify the detail if it is sent
        const details = editOffer.product_details;
        for (i = 0; i < details.length; i++) {
            console.log(details[i].TAILLE);
            if (details[i].MARQUE) {
                if (brand) {
                    details[i].MARQUE = brand;
                }
            }
            if (details[i].TAILLE) {
                if (size) {
                    details[i].TAILLE = size;
                }
            }
            if (details[i].ETAT) {
                if (condition) {
                    details[i].ETAT = condition;
                }
            }
            if (details[i].COULEUR) {
                if (color) {
                    details[i].COULEUR = color;
                }
            }
            if (details[i].EMPLACEMENT) {
                if (city) {
                    details[i].EMPLACEMENT = city;
                }
            }
        }
        // Notify Mongoose that we have modified a Array
        editOffer.markModified("product_details");
        // We download the new image and we modify the new path to the offer
        if (req.files.picture) {
            const file = await cloudinary.uploader.upload(
                req.files.picture.path,
                {
                    folder: `/vinted/offers/${editOffer._id}`,
                }
            );
            editOffer.product_image = { secure_url: file.secure_url };
        }
        // We save editOffer in the database
        await editOffer.save();
        // We send the editOffer to the customer
        res.status(200).json(editOffer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
