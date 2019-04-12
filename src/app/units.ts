export class Unit {
    public text:string;
    public id:number;
    public items:Unit[] = [];
    public constructor(init?:Partial<Unit>){
        Object.assign(this, init);
    }
}
export const unit:Unit = 
        new Unit({text:'Furniture', id:1000, items: [
        new Unit({text:'Tables & Chairs',id:10001, items:[]}),
        new Unit({text:'Sofas',id:10002,items:[]}),
        new Unit({text:'Occasional Furniture',id:10003,items:[]}),
    ]});
       
    