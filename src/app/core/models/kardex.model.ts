import { User } from "./user.model";

/**
 * Firestore document
 * Path of collection: db/aitec/productsList/{productId}/kardex
 * Doc of last updated kardex: db/aitec/productsList/{productId}/lastKardex/{warehouseId}
 * We use last kardex to get info through transaction and update kardex data
 */
export interface Kardex {
  id: string;
  productId: string;
  warehouseId: string;

  type: keyof typeof TIPO_COMPROBANTE;
  //serie Separado por guion
  correlative?: number;      //Refers to the correlative number of sale
  operationType: keyof typeof OPERATION_TYPE;

  invoice: string;        //Numero de documento (de la boleta o factura)
  waybill: string;        //Numero de guia de remisión

  inflow: boolean;        //Se ingresaran productos o se sacarán

  quantity: number;
  unitPrice: number;
  totalPrice: number;     //quantity*unitPrice

  createdBy: User;
  createdAt: Date;

  //The following fields will be calculated and set with a scheduler, and when it is not,
  //will be calculated and displayed ad-hoc with observables
  finalUpdated?: boolean     //+- depends on whether it is inflow or not
  finalQuantity?: number;    //Quantity remaining after operation (sum of last quantity +- quantity)
  finalUnitPrice?: number;   //finalTotalPrice / finalQuantity
  finalTotalPrice?: number;  //last finalTotalPrice +- totalPrice
}

const OPERATION_TYPE = <const>{
  1:	"VENTA",
  2:	"COMPRA",
  3:	"CONSIGNACIÓN RECIBIDA",
  4:	"CONSIGNACIÓN ENTREGADA",
  5:	"DEVOLUCIÓN RECIBIDA",
  6:	"DEVOLUCIÓN ENTREGADA",
  7:	"PROMOCIÓN",
  8:	"PREMIO",
  9:	"DONACIÓN",
  10:	"SALIDA A PRODUCCIÓN",
  11:	"TRANSFERENCIA ENTRE ALMACENES",
  12:	"RETIRO",
  13:	"MERMAS",
  14:	"DESMEDROS",
  15:	"DESTRUCCIÓN",
  16:	"SALDO INICIAL",
  99:	"OTROS (ESPECIFICAR)",
}

const TIPO_COMPROBANTE = <const>{
  0:	"Otros (especificar)",
  1:	"Factura",
  2:	"Recibo por Honorarios",
  3:	"Boleta de Venta",
  4:	"Liquidación de compra",
  5:	"Boleto de compañía de aviación comercial por el servicio de transporte aéreo de pasajeros",
  6:	"Carta de porte aéreo por el servicio de transporte de carga aérea",
  7:	"Nota de crédito",
  8:	"Nota de débito",
  9:	"Guía de remisión - Remitente",
  10:	"Recibo por Arrendamiento",
  11:	"Póliza emitida por las Bolsas de Valores, Bolsas de Productos o Agentes de Intermediación por operaciones realizadas en las Bolsas de Valores o Productos o fuera de las mismas, autorizadas por CONASEV",
  12:	"Ticket o cinta emitido por máquina registradora",
  13:	"Documento emitido por bancos, instituciones financieras, crediticias y de seguros que se encuentren bajo el control de la Superintendencia de Banca y Seguros",
  14:	"Recibo por servicios públicos de suministro de energía eléctrica, agua, teléfono, telex y telegráficos y otros servicios complementarios que se incluyan en el recibo de servicio público",
  15:	"Boleto emitido por las empresas de transporte público urbano de pasajeros",
  16:	"Boleto de viaje emitido por las empresas de transporte público interprovincial de pasajeros dentro del país",
  17:	"Documento emitido por la Iglesia Católica por el arrendamiento de bienes inmuebles",
  18:	"Documento emitido por las Administradoras Privadas de Fondo de Pensiones que se encuentran bajo la supervisión de la Superintendencia de Administradoras Privadas de Fondos de Pensiones",
  19:	"Boleto o entrada por atracciones y espectáculos públicos",
  20:	"Comprobante de Retención",
  21:	"Conocimiento de embarque por el servicio de transporte de carga marítima",
  22:	"Comprobante por Operaciones No Habituales",
  23:	"Pólizas de Adjudicación emitidas con ocasión del remate o adjudicación de bienes por venta forzada, por los martilleros o las entidades que rematen o subasten bienes por cuenta de terceros",
  24:	"Certificado de pago de regalías emitidas por PERUPETRO S.A",
  25:	"Documento de Atribución (Ley del Impuesto General a las Ventas e Impuesto Selectivo al Consumo, Art. 19º, último párrafo, R.S. N° 022-98-SUNAT).",
  26:	"Recibo por el Pago de la Tarifa por Uso de Agua Superficial con fines agrarios y por el pago de la Cuota para la ejecución de una determinada obra o actividad acordada por la Asamblea General de la Comisión de Regantes o Resolución expedida por el Jefe de la Unidad de Aguas y de Riego (Decreto Supremo N° 003-90-AG, Arts. 28 y 48)",
  27:	"Seguro Complementario de Trabajo de Riesgo",
  28:	"Tarifa Unificada de Uso de Aeropuerto",
  29:	"Documentos emitidos por la COFOPRI en calidad de oferta de venta de terrenos, los correspondientes a las subastas públicas y a la retribución de los servicios que presta",
  30:	"Documentos emitidos por las empresas que desempeñan el rol adquirente en los sistemas de pago mediante tarjetas de crédito y débito",
  31:	"Guía de Remisión - Transportista",
  32:	"Documentos emitidos por las empresas recaudadoras de la denominada Garantía de Red Principal a la que hace referencia el numeral 7.6 del artículo 7° de la Ley N° 27133 – Ley de Promoción del Desarrollo de la Industria del Gas Natural",
  34:	"Documento del Operador",
  35:	"Documento del Partícipe",
  36:	"Recibo de Distribución de Gas Natural",
  37:	"Documentos que emitan los concesionarios del servicio de revisiones técnicas vehiculares, por la prestación de dicho servicio",
  50:	"Declaración Única de Aduanas - Importación definitiva",
  52:	"Despacho Simplificado - Importación Simplificada",
  53:	"Declaración de Mensajería o Courier",
  54:	"Liquidación de Cobranza",
  87:	"Nota de Crédito Especial",
  88:	"Nota de Débito Especial",
  91:	"Comprobante de No Domiciliado",
  96:	"Exceso de crédito fiscal por retiro de bienes",
  97:	"Nota de Crédito - No Domiciliado",
  98:	"Nota de Débito - No Domiciliado",
  99:	"Otros -Consolidado de Boletas de Venta",
}