import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome') {
      if (value > balance.total) {
        throw new AppError(
          'Invalid operation. You can not withdraw more than your balance',
        );
      }
    }

    const categoriesRepository = getRepository(Category);
    let savedCategory = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!savedCategory) {
      savedCategory = categoriesRepository.create({ title: category });
      await categoriesRepository.save(savedCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: savedCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
