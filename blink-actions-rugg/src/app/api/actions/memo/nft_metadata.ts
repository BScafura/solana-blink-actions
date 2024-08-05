import wallet from "./wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import axios from 'axios';
// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

//Since we have to return something in our function we need to create an new class
interface Metadata {
    name: string;
    symbol: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
    properties: {
      files: Array<{ type: string; uri: string }>;
    };
    creators: Array<any>;
  }


//imageUriUrl is given from nftImage in nft_image.ts
export const uploadMetada = async (imageUriUrl: string): Promise<string>=> {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure
      
        // Define metadata
          const metadata: Metadata = {
            name: "Breno WBA NFT",
            symbol: "NFT",
            description: "This is my first NFT :D!",
            image: imageUriUrl,
            attributes: [
                { trait_type: 'Background', value: 'Blue' },
                { trait_type: 'Eyes', value: 'Green' }
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: imageUriUrl
                    },
                ]
            },
            creators: [
                {
                    address: signer.publicKey.toString(),
                    share: 100
                }
            ]
        };

        return await umi.uploader.uploadJson(metadata);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
        throw error;
    }
};
