import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import CreateTransactionsService from './CreateTransactionService';

interface RequestDTO {
  filename: string;
}

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: RequestDTO): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);

    const readCsvStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCsv = readCsvStream.pipe(parseStream);

    const transactions: TransactionDTO[] = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line;

      transactions.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => {
      parseCsv.on('end', resolve);
    });

    const createTransactionsService = new CreateTransactionsService();
    const savedTransactions: Transaction[] = [];

    for (const iterator of transactions) {
      savedTransactions.push(await createTransactionsService.execute(iterator));
    }

    return savedTransactions;
  }
}

export default ImportTransactionsService;
