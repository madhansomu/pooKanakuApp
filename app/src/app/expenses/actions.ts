'use server';

import { supabaseServer } from '../../lib/supabaseServer';
import { revalidatePath } from 'next/cache';

const EXPENSE_CATEGORIES = [
  'Flower Purchase',
  'Transportation',
  'Salary',
  'Electricity',
  'Packaging',
  'Miscellaneous',
] as const;

export { EXPENSE_CATEGORIES };

export async function getExpenses() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
  return data;
}

export async function createExpense(formData: FormData) {
  const category = formData.get('category') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const expenseDate = formData.get('expense_date') as string;
  const description = formData.get('description') as string;

  if (!category || !amount || !expenseDate) {
    return { success: false, error: 'Category, amount, and date are required' };
  }

  const sb = supabaseServer();
  const { error } = await sb.from('expenses').insert({
    category,
    amount,
    expense_date: expenseDate,
    description: description || null,
  });

  if (error) {
    console.error('Error creating expense:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/expenses');
  revalidatePath('/');
  return { success: true };
}

export async function deleteExpense(id: string) {
  const sb = supabaseServer();
  const { error } = await sb.from('expenses').delete().eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/expenses');
  revalidatePath('/');
  return { success: true };
}
