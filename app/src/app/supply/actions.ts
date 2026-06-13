'use server';

import { supabaseServer } from '../../lib/supabaseServer';
import { revalidatePath } from 'next/cache';

export async function getSupplies() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('daily_supplies')
    .select(`
      *,
      customers ( name ),
      flower_types ( name, unit )
    `)
    .order('supply_date', { ascending: false });

  if (error) {
    console.error('Error fetching supplies:', error);
    return [];
  }
  return data;
}

export async function getCustomersForDropdown() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('customers')
    .select('id, name')
    .order('name');
  if (error) return [];
  return data;
}

export async function getFlowersForDropdown() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('flower_types')
    .select('id, name, default_rate, unit')
    .eq('status', 'Active')
    .order('name');
  if (error) return [];
  return data;
}

export async function createSupply(formData: FormData) {
  const customerId = formData.get('customer_id') as string;
  const flowerTypeId = formData.get('flower_type_id') as string;
  const supplyDate = formData.get('supply_date') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const unitRate = parseFloat(formData.get('unit_rate') as string);
  const remarks = formData.get('remarks') as string;

  const sb = supabaseServer();
  const { error } = await sb.from('daily_supplies').insert({
    customer_id: customerId,
    flower_type_id: flowerTypeId,
    supply_date: supplyDate,
    quantity,
    unit_rate: unitRate,
    remarks,
  });

  if (error) {
    console.error('Error creating supply:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/supply');
  return { success: true };
}

export async function updateSupply(id: string, formData: FormData) {
  const customerId = formData.get('customer_id') as string;
  const flowerTypeId = formData.get('flower_type_id') as string;
  const supplyDate = formData.get('supply_date') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const unitRate = parseFloat(formData.get('unit_rate') as string);
  const remarks = formData.get('remarks') as string;

  const sb = supabaseServer();
  const { error } = await sb.from('daily_supplies').update({
    customer_id: customerId,
    flower_type_id: flowerTypeId,
    supply_date: supplyDate,
    quantity,
    unit_rate: unitRate,
    remarks,
  }).eq('id', id);

  if (error) {
    console.error('Error updating supply:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/supply');
  return { success: true };
}

export async function deleteSupply(id: string) {
  const sb = supabaseServer();
  const { error } = await sb.from('daily_supplies').delete().eq('id', id);

  if (error) {
    console.error('Error deleting supply:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/supply');
  return { success: true };
}
