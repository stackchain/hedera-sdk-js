const sdk = require("@hashgraph/sdk");

const smartContract = require("./stateful.json");
const smartContractByteCode = smartContract.contracts[ "stateful.sol:StatefulContract" ].bin;

async function main() {
    if (process.env.OPERATOR_KEY == null || process.env.OPERATOR_ID == null) {
        throw new Error("environment variables OPERATOR_KEY and OPERATOR_ID must be present");
    }

    const operatorPrivateKey = sdk.Ed25519PrivateKey.fromString(process.env.OPERATOR_KEY)
    const operatorAccount = process.env.OPERATOR_ID;

    const client = new sdk.Client({
        network: { "0.testnet.hedera.com:50211": "0.0.3" },
        operator: {
            account: operatorAccount,
            privateKey: operatorPrivateKey
        }
    });

    // -----------------------------------
    // AccountCreateTransaction
    // -----------------------------------

    const privateKey = await sdk.Ed25519PrivateKey.generate();

    let tx = await new sdk.AccountCreateTransaction()
        .setKey(privateKey.publicKey)
        .setInitialBalance(new sdk.Hbar(2))
        .execute(client);

    const accountId = (await tx.getReceipt(client)).getAccountId();
    let record = await tx.getRecord(client);

    console.log(JSON.stringify(await tx.getRecord(client)));

    // -----------------------------------
    // AccountUpdateTransaction
    // -----------------------------------

    tx = await new sdk.AccountUpdateTransaction()
        .setAccountId(operatorAccount)
        .setSendRecordThreshold(1000000000)
        .execute(client);

    console.log(JSON.stringify(record));

    // -----------------------------------
    // AccountDeleteTransaction
    // -----------------------------------

    tx = await new sdk.AccountDeleteTransaction()
        .setDeleteAccountId(accountId)
        .setTransferAccountId(operatorAccount)
        .setTransactionId(new sdk.TransactionId(accountId))
        .build(client)
        .sign(privateKey)
        .execute(client);

    console.log(JSON.stringify(await tx.getRecord(client)));

    // -----------------------------------
    // CryptoTransferTransaction
    // -----------------------------------

    tx = await new sdk.CryptoTransferTransaction()
        .addSender(operatorAccount, 10)
        .addRecipient(1001, 10)
        .execute(client);

    console.log(JSON.stringify(await tx.getRecord(client)));

    // -----------------------------------
    // FileCreateTransaction
    // -----------------------------------

    const file = await new sdk.FileCreateTransaction()
        .setMaxTransactionFee(new sdk.Hbar(3))
        .addKey(operatorPrivateKey.publicKey)
        .setContents(smartContractByteCode)
        .execute(client);

    const fileId = (await file.getReceipt(client)).getFileId();
    record = await file.getRecord(client);

    console.log(JSON.stringify(record));

    // -----------------------------------
    // ContractCreateTransaction
    // -----------------------------------

    tx = await new sdk.ContractCreateTransaction()
        .setMaxTransactionFee(new sdk.Hbar(100))
        .setAdminKey(operatorPrivateKey.publicKey)
        .setGas(2000)
        .setConstructorParams(new sdk.ContractFunctionParams()
            .addString("hello from hedera"))
        .setBytecodeFileId(fileId)
        .execute(client);

    const contractId = (await tx.getReceipt(client)).getContractId();

    console.log(JSON.stringify(await tx.getRecord(client)));

    // -----------------------------------
    // ContractExecuteTransaction
    // -----------------------------------

    tx = await new sdk.ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(7000)
        .setFunction("setMessage", new sdk.ContractFunctionParams()
            .addString("hello from hedera again!"))
        .execute(client);

    console.log(JSON.stringify(await tx.getRecord(client)));

    // -----------------------------------
    // ContractUpdateTransaction
    // -----------------------------------

    tx = await new sdk.ContractUpdateTransaction()
        .setContractId(contractId)
        .setContractMemo("test")
        .execute(client);

    console.log(JSON.stringify(await tx.getRecord(client)));

    // -----------------------------------
    // ContractDeleteTransaction
    // -----------------------------------

    tx = await new sdk.ContractDeleteTransaction()
        .setContractId(contractId)
        .execute(client);

    console.log(JSON.stringify(await tx.getRecord(client)));

    // -----------------------------------
    // FileUpdateTransaction
    // -----------------------------------

    tx = await new sdk.FileUpdateTransaction()
        .setFileId(fileId)
        .setContents("Random")
        .execute(client);

    console.log(JSON.stringify(await tx.getRecord(client)));

    // -----------------------------------
    // FileDeleteTransaction
    // -----------------------------------

    tx = await new sdk.FileDeleteTransaction()
        .setFileId(fileId)
        .execute(client);

    console.log(JSON.stringify(await tx.getRecord(client)));
}

main();

