import { Component, OnInit, Input } from "@angular/core";
import { BehaviorSubject, Observable, combineLatest } from "rxjs";
import {
  Sale,
  saleStatusOptions,
  SaleRequestedProducts,
} from "src/app/core/models/sale.model";
import { shareReplay, startWith, switchMap, map, tap } from "rxjs/operators";
import { FormControl } from "@angular/forms";
import { DatabaseService } from "src/app/core/services/database.service";
import { MatDialog } from "@angular/material/dialog";
import * as XLSX from "xlsx";
import { DatePipe } from "@angular/common";

@Component({
  selector: "app-sales-master",
  templateUrl: "./sales-master.component.html",
  styleUrls: ["./sales-master.component.scss"],
})
export class SalesMasterComponent implements OnInit {
  @Input() detailSubject: BehaviorSubject<Sale>;
  @Input() locationSubject: BehaviorSubject<Number>;
  @Input() totalPriceSubject: BehaviorSubject<number>;

  defaultImage = "../../../../assets/images/no-image.png";

  saleStatusOptions = new saleStatusOptions();

  p: number = 1;
  dateLimit: Date;

  saleStateSubject: BehaviorSubject<string> = new BehaviorSubject("Total");
  saleState$: Observable<string> = this.saleStateSubject
    .asObservable()
    .pipe(shareReplay(1));
  salesFiltered$: Observable<Sale[]>;

  date: FormControl;
  statusForm: FormControl;
  search: FormControl;

  sales$: Observable<Sale[]>;
  status: string[] = [];
  search$: Observable<string>;

  constructor(
    private dbs: DatabaseService,
    private dialog: MatDialog,
    public datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.dateLimit = new Date();
    this.initForms();
    this.initObservables();
  }

  initForms() {
    let date = new Date(this.dateLimit);
    date.setMilliseconds(date.getMilliseconds() - 30 * 8.64e7);

    this.date = new FormControl({
      begin: date,
      end: this.dateLimit,
    });

    this.status = Object.values(new saleStatusOptions());

    this.statusForm = new FormControl("Todos");
    this.search = new FormControl("");
  }

  initObservables() {
    this.sales$ = this.date.valueChanges.pipe(
      startWith(this.date.value),
      switchMap((date: { begin: Date; end: Date }) => {
        this.detailSubject.next(null);
        let endDate = date.end;
        endDate.setHours(23, 59, 59);
        return this.dbs.getSales({ begin: date.begin, end: endDate });
      }),
      map((sales) => {
        return sales;
      })
    );

    this.search$ = this.search.valueChanges;

    this.salesFiltered$ = combineLatest([
      this.search$.pipe(
        tap((res) => {
          this.detailSubject.next(null);
        }),
        startWith("")
      ),
      this.sales$,
      this.statusForm.valueChanges.pipe(
        tap((res) => {
          this.detailSubject.next(null);
        }),
        startWith("Todos")
      ),
    ]).pipe(
      map(([search, sales, saleState]) => {
        //console.log(sales)
        let order = sales.sort(
          (a, b) => Number(b.correlative) - Number(a.correlative)
        );
        if (saleState == "Todos") {
          if (this.totalPriceSubject) {
            this.totalPriceSubject.next(this.giveTotalSalesPrice(order));
          }

          return order.filter((el) => {
            return (
              el.correlative.toString().includes(search) ||
              el.user.email?.includes(search.toLowerCase()) ||
              el.user.name?.toLowerCase().includes(search.toLowerCase()) ||
              el.user.lastName1?.toLowerCase().includes(search.toLowerCase()) ||
              el.user.lastName2?.toLowerCase().includes(search.toLowerCase())
            );
          });
        } else {
          if (this.totalPriceSubject) {
            this.totalPriceSubject.next(
              this.giveTotalSalesPrice(
                order.filter((el) => el.status == saleState)
              )
            );
          }
          return order.filter((el) => {
            return (
              el.status == saleState &&
              (el.correlative.toString().includes(search) ||
                el.user.email?.includes(search.toLowerCase()) ||
                el.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                el.user.lastName1
                  ?.toLowerCase()
                  .includes(search.toLowerCase()) ||
                el.user.lastName2?.toLowerCase().includes(search.toLowerCase()))
            );
          });
        }
      }),
      shareReplay(1)
    );
  }

  onSelectDetail(data: Sale, salesFiltered: Sale[]) {
    this.detailSubject.next(undefined);
    let index = salesFiltered.findIndex((el) => el.id == data.id);
    setTimeout(() => {
      this.locationSubject.next(index);
      this.detailSubject.next(data);
    }, 4);
  }

  downloadXls(sales: Sale[]): void {
    ////console.log(sales);
    let table_xlsx: any[] = [];
    let headersXlsx = [
      "Correlativo",
      "Usuario",
      "NIT",
      "e-mail",
      "Estado",
      "Total",
      "Fecha de Solicitud",
      //'Fecha de Envio Deseada',
      "Usuario de Confirmación de Stock",
      "Fecha de Confirmación de de Stock",
      "Usuario de Confirmación de Solicitud",
      "Fecha de Confirmación de Solicitud",
      "Usuario de Confirmación de Comprobante",
      "Fecha de Confirmación de Comprobante",
      "Número de comprobante",
      "Cancelado por",
      "Fecha de Cancelación",
      "Sub Total",
      "IVA",
      "Total",
      "Paquete",
      "Descripción",
      "SKU",
      "Cantidad",
      "Precio",
    ];

    table_xlsx.push(headersXlsx);

    sales.forEach((sale) => {
      const temp = [
        sale.correlative.toString().padStart(6, "0"),
        sale.user.name
          ? sale.user.lastName1
            ? sale.user.lastName2
              ? sale.user.name +
                " " +
                sale.user.lastName1 +
                " " +
                sale.user.lastName2
              : sale.user.name + " " + sale.user.lastName1
            : sale.user.name
          : "Sin nombre",
        sale.user.nci ? sale.user.nci : "---",
        sale.user.email,
        sale.status,
        this.giveTotalPrice(sale).toFixed(2),
        sale.createdAt ? this.getXlsDate(sale.createdAt) : "-",
        //sale.requestDate ? this.getXlsDate(sale.requestDate) : "-",
        sale.confirmedStockData
          ? sale.confirmedStockData.confirmedBy.name
            ? sale.confirmedStockData.confirmedBy.lastName1
              ? sale.confirmedStockData.confirmedBy.lastName2
                ? sale.confirmedStockData.confirmedBy.name +
                  " " +
                  sale.confirmedStockData.confirmedBy.lastName1 +
                  " " +
                  sale.confirmedStockData.confirmedBy.lastName2
                : sale.confirmedStockData.confirmedBy.name +
                  " " +
                  sale.confirmedStockData.confirmedBy.lastName1
              : sale.confirmedStockData.confirmedBy.name
            : sale.confirmedStockData.confirmedBy.name
            ? sale.confirmedStockData.confirmedBy.name
            : "Sin nombre"
          : "-",
        sale.confirmedStockData
          ? this.getXlsDate(sale.confirmedStockData.confirmedAt)
          : "-",
        sale.confirmedRequestData
          ? sale.confirmedRequestData.confirmedBy.name
            ? sale.confirmedRequestData.confirmedBy.lastName1
              ? sale.confirmedRequestData.confirmedBy.lastName2
                ? sale.confirmedRequestData.confirmedBy.name +
                  " " +
                  sale.confirmedRequestData.confirmedBy.lastName1 +
                  " " +
                  sale.confirmedRequestData.confirmedBy.lastName2
                : sale.confirmedRequestData.confirmedBy.name +
                  " " +
                  sale.confirmedRequestData.confirmedBy.lastName1
              : sale.confirmedRequestData.confirmedBy.name
            : "Sin nombre"
          : "-",
        sale.confirmedRequestData
          ? this.getXlsDate(sale.confirmedRequestData.confirmedAt)
          : "-",
        sale.confirmedDocumentData
          ? sale.confirmedDocumentData.confirmedBy.name
            ? sale.confirmedDocumentData.confirmedBy.lastName1
              ? sale.confirmedDocumentData.confirmedBy.lastName2
                ? sale.confirmedDocumentData.confirmedBy.name +
                  " " +
                  sale.confirmedDocumentData.confirmedBy.lastName1 +
                  " " +
                  sale.confirmedDocumentData.confirmedBy.lastName2
                : sale.confirmedDocumentData.confirmedBy.name +
                  " " +
                  sale.confirmedDocumentData.confirmedBy.lastName1
              : sale.confirmedDocumentData.confirmedBy.name
            : "Sin nombre"
          : "-",
        sale.confirmedDocumentData
          ? this.getXlsDate(sale.confirmedDocumentData.confirmedAt)
          : "-",
        sale.confirmedDocumentData
          ? sale.confirmedDocumentData.documentNumber
          : "-",
        //sale.confirmedDeliveryData ? this.getXlsDate(sale.confirmedDeliveryData.confirmedAt) : "-",
        //sale.driverAssignedData ? this.getXlsDate(sale.driverAssignedData.assignedAt) : "-",
        //sale.finishedData ? this.getXlsDate(sale.finishedData.finishedAt) : "-",
        sale.cancelledData
          ? sale.cancelledData.cancelledBy.name
            ? sale.cancelledData.cancelledBy.lastName1
              ? sale.cancelledData.cancelledBy.lastName2
                ? sale.cancelledData.cancelledBy.name +
                  " " +
                  sale.cancelledData.cancelledBy.lastName1 +
                  " " +
                  sale.cancelledData.cancelledBy.lastName2
                : sale.cancelledData.cancelledBy.name +
                  " " +
                  sale.cancelledData.cancelledBy.lastName1
              : sale.cancelledData.cancelledBy.name
            : "Sin nombre"
          : "-",
        sale.cancelledData
          ? this.getXlsDate(sale.cancelledData.cancelledAt)
          : "-",
        (
          this.giveTotalPrice(sale) -
          (this.giveTotalPrice(sale) / 1.1494) * 0.1494
        ).toFixed(2), //Soles
        ((this.giveTotalPrice(sale) / 1.1494) * 0.1494).toFixed(2),
        this.giveTotalPrice(sale).toFixed(2),
      ];
      //      'Producto', 'Cantidad', 'Precio'

      sale.requestedProducts.forEach((prod) => {
        let temp2;

        if (!prod.product.package) {
          temp2 = [
            ...temp,
            "-",
            prod.product.description,
            prod.product.sku,
            prod.quantity,
            this.givePrice(prod).toFixed(2), //Soles
          ];
          table_xlsx.push(temp2);
        } else {
          prod.chosenOptions.map((el) => {
            if (el) {
              temp2 = [
                ...temp,
                prod.product.description,
                prod.product.sku,
                el.description,
                prod.quantity,
                el.unit.weight,
                prod.quantity * el.unit.weight,
                this.givePrice(prod).toFixed(2),
              ];
              table_xlsx.push(temp2);
            }
          });
        }
      });
    });

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relacion_de_Ventas");

    /* save to file */
    const name = "Relacion_de_Ventas" + ".xlsx";
    XLSX.writeFile(wb, name);
  }

  getCurrentMonthOfViewDate(): { from: Date; to: Date } {
    const date = new Date();
    const fromMonth = date.getMonth();
    const fromYear = date.getFullYear();

    const actualFromDate = new Date(fromYear, fromMonth, 1);

    const toMonth = (fromMonth + 1) % 12;
    let toYear = fromYear;

    if (fromMonth + 1 >= 12) {
      toYear++;
    }

    const toDate = new Date(toYear, toMonth, 1);

    return { from: actualFromDate, to: toDate };
  }

  getCorrelative(corr: number) {
    return corr.toString().padStart(4, "0");
  }

  getXlsDate(date) {
    let dateObj = new Date(1970);
    dateObj.setSeconds(date["seconds"]);
    return this.datePipe.transform(dateObj, "dd/MM/yyyy");
  }

  givePrice(item: SaleRequestedProducts): number {
    let totalPrice = 0;
    ////console.log(item.product)
    if (item.product.promo) {
      let promos = this.getPromos(item);
      promos.forEach((el) => {
        totalPrice = totalPrice + el.numberPromos * el.promo.promoPrice;
      });
      totalPrice =
        totalPrice +
        item.product.price *
          (item.quantity -
            promos.reduce(
              (prev, curr) => prev + curr.numberPromos * curr.promo.quantity,
              0
            ));

      return totalPrice;
    } else {
      totalPrice = item.quantity * item.product.price;
      return totalPrice;
    }
  }

  getPromos(
    item: SaleRequestedProducts
  ): {
    promo: SaleRequestedProducts["product"]["promoData"][0];
    numberPromos: number;
  }[] {
    let number = item.quantity;

    let promos: {
      promo: SaleRequestedProducts["product"]["promoData"][0];
      numberPromos: number;
    }[] = [];
    item.product.promoData
      .sort((a, b) => b.quantity - a.quantity)
      .forEach((el) => {
        let floor = Math.floor(number / el.quantity);
        if (floor >= 1) {
          number = number - floor * el.quantity;
          promos.push({
            promo: el,
            numberPromos: floor,
          });
        } else {
          promos.push({
            promo: el,
            numberPromos: 0,
          });
        }
      });

    return promos;
  }

  giveTotalPrice(sale: Sale): number {
    return sale.requestedProducts.reduce((a, b) => a + this.givePrice(b), 0);
  }

  giveTotalSalesPrice(sales: Sale[]): number {
    return sales.reduce(
      (a, b) => a + this.giveTotalPrice(b) /*+ b.deliveryPrice*/,
      0
    );
  }

  getStatus(status: string) {
    switch (status) {
      case "Pedido":
        return "#87A2C7";
        break;
      case "Stock Confirmado":
        return "#3865A3";
        break;
      case "Solicitud Confirmada":
        return "#FFCC00";
        break;
      case "Comprobante Confirmado":
        return "#64A338";
        break;
      default:
        return "#E03B24";
        break;
    }
  }
}
