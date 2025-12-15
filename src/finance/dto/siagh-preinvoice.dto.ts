/**
 * Siagh Finance System PreInvoice DTOs
 * Based on actual Siagh API documentation
 */

export interface SiaghPreInvoiceItemDto {
  codekala: string;
  nameunit: string;
  qty: number;
  price: number;
  mabtakhfif?: number;
  vazn?: string;
  hajm?: string;
  radif: string;
  finalqty?: number;
  takhfif?: number;
  sumamelinc?: number;
  sumameldec?: number;
}

export interface SiaghPreInvoiceDto {
  Code?: number;
  ShomareSanad?: string;
  TarikhSanad?: string;
  
  // Customer reference
  CodeMoshtari: string;
  CodeContact?: string;
  
  // Invoice items
  Items: SiaghPreInvoiceItemDto[];
  
  // Financial details
  MablaghKhales?: number;
  
  // Invoice settings
  CodeNoeeSanad?: string;
  CodeSaleModel?: string;
  SalMali?: number;
  CodeNoeePardakht?: string;
  CodeMarkazForush?: string;
  CodeNoeeForush?: string;
  CodeVaseteh?: string;
  Tozihat?: string;
  NameNoeSanad?: string;
}

export interface CreateSiaghPreInvoiceRequest {
  codenoeesanad?: string; // نوع سند (2 = پیش فاکتور فروش)
  codesalemodel?: string; // مدل فروش
  salmali?: number; // سال مالی
  codenoeepardakht?: string; // نوع پرداخت
  codemarkazforush?: string; // مرکز فروش
  codecontact?: string; // کد مخاطب
  codemoshtari: string; // کد مشتری (طرف حساب)
  codenoeeforush?: string; // نوع فروش
  codevaseteh?: string; // واسطه
  tozihat?: string; // توضیحات
  namenoesanad?: string; // نام نوع سند
  items: Array<{
    codekala: string;
    nameunit: string;
    qty: number;
    price: number;
    mabtakhfif?: number;
    vazn?: string;
    hajm?: string;
    radif: string;
  }>;
}

