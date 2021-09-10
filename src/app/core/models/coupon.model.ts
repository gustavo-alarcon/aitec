export interface Coupon {
  id: string;
  name: string;
  redirectTo: string;
  
  //The discount could be applied to either a category, a brand, or all
  //In case of category, categorry will be filled and brand null.
  category: Category;     //Category where coupon will be applicable
  brand: string;        //brand where coupon will be applicable

  limitDate: boolean;   //Available limit
  startDate?: Date;
  endDate?: Date;

  type: number;         //1 for money, 2 for percentage
  discount: number;     //Discount amount (money or percentage)
  limit: number;        //Max discount in case of percentage type

  createdAt: Date;
  users?: string[];     //Usersid who already used coupon
  count?: number;
  from: number;         //Minimum amount of money for discount
}

//About Category interface:
//If only id is filled, then it will refer to category. If id and idCategory
//are filled, they will refer to subcategory and category respectively.
//If id idCategory and idSubcategory are filled, they will refer to
// subsubcategory, category and subcategory
export interface Category {
  completeName: string;
  createdAt: Date
  editedAt: Date
  id: string
  idCategory: string
  idSubCategory: string
  name: string
}