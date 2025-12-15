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
    CodeMoshtari: string;
    CodeContact?: string;
    Items: SiaghPreInvoiceItemDto[];
    MablaghKhales?: number;
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
    codenoeesanad?: string;
    codesalemodel?: string;
    salmali?: number;
    codenoeepardakht?: string;
    codemarkazforush?: string;
    codecontact?: string;
    codemoshtari: string;
    codenoeeforush?: string;
    codevaseteh?: string;
    tozihat?: string;
    namenoesanad?: string;
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
