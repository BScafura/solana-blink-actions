import wallet from "./wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { readFile } from "fs/promises"
import path from "path"


// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

export const nftImage = async () => {
    try {
            // Using fetch readFile method
            const imageFile = await readFile(path.join(__dirname,"./ruggBlink.png"));
            // Create a generic file object cause the fuction upload from umi receives an array of generic files
            const umiImageFile = createGenericFile(imageFile, "RUGGED!", {tags: [{name: "Content Type", value: "image/jpeg"}]});

            const imageUri = await umi.uploader.upload([umiImageFile]).catch((err) =>{
                console.error(err);
                throw err;
            });
           
            //If you want to upload more than one image, you can passe it as an array with multiple elements. To accesses than you can iterate the array
            const imageUriUpload = imageUri[0]; // Access the first URI in the array (readFile)
            return imageUriUpload;
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
};
