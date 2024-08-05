import { ActionGetResponse, ActionParameter, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS, createPostResponse, LinkedAction, MEMO_PROGRAM_ID } from "@solana/actions";
import { clusterApiUrl, ComputeBudgetProgram, Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { headers } from "next/headers";

import { nftImage } from "./nft_image";
import { uploadMetada } from "./nft_metadata";
import { nftMint } from "./nft_mint";


export const GET = (req: Request) => {


    //const urlParameter: ActionParameter<"url"> = {
    //    type: "url",
   //     name: "ruggUrl",
   //     label: "Enter the rugg URI",
    //    required: true,
    //};


    //const relatedActions: LinkedAction[] = [
    //    {
    //        label: "Submit",
    //        href: new URL("/blink-actions-rugg/public/actions/submitUrl", new URL(req.url).origin).toString(),
    //        parameters: [urlParameter]
    //    }
    //];

    const ruggMetadata: ActionGetResponse = {
        icon: new URL("img/ruggBlink.png", new URL(req.url).origin).toString(), // Absolute URL
        label: "Mint!",
        description: "This blink will mint the rugg above into your wallet",
        title: "Mint this rugg right now!",
    };

    return Response.json(ruggMetadata, {
        headers: ACTIONS_CORS_HEADERS
    });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
    try {
        //Create a new transaction using the web3.js
        const transaction = new Transaction();
        //Store the informations of the user for verification
        const body: ActionPostRequest = await req.json();
        // Assures that the account is being provided
        if (!body || !body.account) {
            return Response.json("Non valid payload provided", {
              status: 400,
              headers: ACTIONS_CORS_HEADERS,
            });
        }

        //Upload the image using nftImage from nft_image
        const imageUriUrl = await nftImage();
        if (imageUriUrl === undefined) {
            return Response.json("Failed to upload image", {
                status: 500,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        //Upload the metada using uploadMetada from nft_metada and the imageUriUrl (the uploaded image)
        const metadata = await uploadMetada(imageUriUrl);
        
        //Turn the body.account into the publicKey
        const accountPublicKey = new PublicKey(body.account);
        //Mint the nft creating a new transaction using the nftMint and the accountPublicKey and metadata parameters
        const tx = await nftMint(accountPublicKey, metadata);
        
        //Create an new account object using the PublicKey class so we can storage the user address and verifify if it exists
        let account: PublicKey;
        try {
            //The account variable has now the account address of the user in session
            account = new PublicKey(body.account);
        } catch (err) {
            return new Response("Invalid Account provided", {
                status: 400,
                headers: ACTIONS_CORS_HEADERS
            });
        }

        //Transaction logic
        transaction.add(
            //Priority Fee(creatrePostResponde requires at least 1 non-memo instruction)
            ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: 1000,
            }),
            //Instruction
            new TransactionInstruction({
                programId: new PublicKey(MEMO_PROGRAM_ID), //The Memo Program ID is standard and we import it from the @solana/actions package
                data: Buffer.from("Your rugg is already in your wallet", "utf-8"),
                keys:[],
            }),
        );
        //Set the account storaged as the feePayer of the transaction handled in the blink
        transaction.feePayer = account;
        //Connecting to the Solana Server using devnet
        const connection = new Connection(clusterApiUrl("devnet"));
        //Get the recent blockhash to sign the transaction [its a must do in Solana Blockchain] for this we are using methods and properties of the web3.js Transaction classes 
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        // Create a payload to post using the method createPostResponse from web3.js. The content will generate the information that we are posting as a json in the next step
        const payload: ActionPostResponse = await createPostResponse({
            fields: {
                transaction: tx,
                message:"Congratulations! You got yourself a new rugg!"
            },
            //signers: [],
        })

        // Return the response to the user with the created transaction
        return Response.json(payload, {headers: ACTIONS_CORS_HEADERS});
    } catch (err) {
        return Response.json("An unknown error occurred", {status: 400});
    }
};


