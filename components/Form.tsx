import { FC } from "react";
import { StudentIntro } from "../models/StudentIntro";
import { useState } from "react";
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Textarea,
} from "@chakra-ui/react";
import {
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { STUDENT_INTRO_PROGRAM_ID } from "../utils/constants";

// const STUDENT_INTRO_PROGRAM_ID = 'HdE95RSVsdb315jfJtaykXhXY478h53X6okDupVfY9yf'

export const Form: FC = () => {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");

    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const handleSubmit = (event: any) => {
        event.preventDefault();
        const studentIntro = new StudentIntro(name, message);
        handleTransactionSubmit(studentIntro);
    };

    const handleTransactionSubmit = async (studentIntro: StudentIntro) => {
        if (!publicKey) {
            alert("Please connect your wallet!");
            return;
        }

        const buffer = studentIntro.serialize();
        const transaction = new web3.Transaction();

        const [pda] = await web3.PublicKey.findProgramAddress(
            [publicKey.toBuffer()],
            new web3.PublicKey(STUDENT_INTRO_PROGRAM_ID)
        );

        const [counterPda] = await web3.PublicKey.findProgramAddress(
            [pda.toBuffer(), Buffer.from("reply")],
            new web3.PublicKey(STUDENT_INTRO_PROGRAM_ID)
        );

        const [tokenMint] = await web3.PublicKey.findProgramAddress(
            [Buffer.from("token_mint")],
            new web3.PublicKey(STUDENT_INTRO_PROGRAM_ID)
        );

        const [mintAuth] = await web3.PublicKey.findProgramAddress(
            [Buffer.from("token_auth")],
            new web3.PublicKey(STUDENT_INTRO_PROGRAM_ID)
        );

        const userAta = await getAssociatedTokenAddress(tokenMint, publicKey);
        const ataAccount = await connection.getAccountInfo(userAta);

        if (!ataAccount) {
            const ataInstruction = createAssociatedTokenAccountInstruction(
                publicKey,
                userAta,
                publicKey,
                tokenMint
            );
            transaction.add(ataInstruction);
        }

        const instruction = new web3.TransactionInstruction({
            keys: [
                {
                    pubkey: publicKey,
                    isSigner: true,
                    isWritable: false,
                },
                {
                    pubkey: pda,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: counterPda,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: tokenMint,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: mintAuth,
                    isSigner: false,
                    isWritable: false,
                },
                {
                    pubkey: userAta,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: web3.SystemProgram.programId,
                    isSigner: false,
                    isWritable: false,
                },
                {
                    pubkey: TOKEN_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false,
                },
            ],
            data: buffer,
            programId: new web3.PublicKey(STUDENT_INTRO_PROGRAM_ID),
        });

        transaction.add(instruction);

        try {
            let txid = await sendTransaction(transaction, connection);
            alert(
                `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`
            );
            console.log(
                `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`
            );
        } catch (e) {
            console.log(JSON.stringify(e));
            alert(JSON.stringify(e));
        }
    };

    return (
        <Box
            p={4}
            display={{ md: "flex" }}
            maxWidth="32rem"
            borderWidth={1}
            margin={2}
            justifyContent="center"
        >
            <form onSubmit={handleSubmit}>
                <FormControl isRequired>
                    <FormLabel color="gray.200">What do we call you?</FormLabel>
                    <Input
                        id="name"
                        color="gray.400"
                        onChange={(event) => setName(event.currentTarget.value)}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel color="gray.200">
                        What brings you to Solana, friend?
                    </FormLabel>
                    <Textarea
                        id="message"
                        color="gray.400"
                        onChange={(event) =>
                            setMessage(event.currentTarget.value)
                        }
                    />
                </FormControl>
                <Button width="full" mt={4} type="submit">
                    Submit
                </Button>
            </form>
        </Box>
    );
};
