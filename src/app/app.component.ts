import { State, process } from '@progress/kendo-data-query';
import { Component, Renderer2, NgZone, AfterViewInit, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { RowClassArgs,SelectableSettings,RowArgs  } from '@progress/kendo-angular-grid';
import { products } from './products';
import { Unit, unit } from './units';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { take } from 'rxjs/operators/take';
import { tap } from 'rxjs/operators/tap';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { of } from 'rxjs/observable/of';
import { DOMService$1 } from '@progress/kendo-angular-dateinputs';

const tableRow = node => node.tagName.toLowerCase() === 'tr';
const treeRow = node => node.tagName.toLowerCase() === 'li';
const closest = (node, predicate) => {
  while (node && node.tagName && !predicate(node)) {
    node = node.parentNode;
  }
  return node;
};


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
      .k-grid tr.dragging {
      background-color: #f45c42;
      };
  `]
})

export class AppComponent implements AfterViewInit, OnDestroy {
  private prods = products;
  public data: Unit=unit;
  public mode = 'multiple';
  public selectableSettings: SelectableSettings = {
    mode: 'multiple'
};
  public mySelection: number[] = [];
  private draggedItemIndex:number;
  private dropItemIndex:number;
  private dropItemParentIndex:number;
  private treeindex:number;
  public state: State = {
    skip: 0,
    take: 10
  };
  public gridData: any = process(this.prods, this.state);
  private currentSubscription: Subscription;
  constructor(private renderer: Renderer2, private zone: NgZone) { }
  public ngAfterViewInit(): void {
    this.currentSubscription = this.handleDragAndDrop();
    this.currentSubscription.add(this.handleTreeDragAndDrop2());
    //this.currentSubscription.add(this.handleTreeDragAndDrop3());
  }

  public ngOnDestroy(): void {
    this.currentSubscription.unsubscribe();
  }

  private handleTreeDragAndDrop2(): Subscription {
    const sub2 = new Subscription(() => {});
    //let draggedItemIndex;
    var container = document.querySelector("#test1");
    
    const tableRows = Array.from(container.querySelectorAll('li'));
    
    tableRows.forEach(item => {
      //console.log(item);
        const dragOver = fromEvent(item, 'dragover');

        sub2.add(dragOver.subscribe((e: any) => {
          e.preventDefault();
          
          const liitem: HTMLLIElement = <HTMLLIElement>e.target;
          const span = liitem.querySelector('span')
          //console.log(span.id);
          this.treeindex = parseInt(span.id);
       
        }));
     
    });
    
    return sub2;
  }

  myChange(){
    console.log('my change');
    this.currentSubscription.add(this.handleTreeDragAndDrop3());
  }
  private handleTreeDragAndDrop3(): Subscription {
    //console.log('handleTreeDragAndDrop3')
    const sub3 = new Subscription(() => {});
    //let draggedItemIndex;
    var container = document.querySelector("#test1");
    
    const tableRows = Array.from(container.querySelectorAll('ol'));
    //console.log(tableRows)
    tableRows.forEach(item => {
      //console.log(item);
      this.renderer.setAttribute(item, 'draggable', 'true');
      const dragStart = fromEvent<DragEvent>(item, 'dragstart');
      const dragEnd = fromEvent(item, 'dragend');
      sub3.add(dragStart.pipe(
        tap(({ dataTransfer }) => {
          try {
            const dragImgEl = document.createElement('span');
            dragImgEl.setAttribute('style', 'position: absolute; display: block; top: 0; left: 0; width: 0; height: 0;');
            document.body.appendChild(dragImgEl);
            dataTransfer.setDragImage(dragImgEl, 0, 0);
          } catch (err) {
          // IE doesn't support setDragImage
          }
          try {
          // Firefox won't drag without setting data
            dataTransfer.setData('application/json', '');
          } catch (err) {
          // IE doesn't support MIME types in setData
          }
          })
        ).subscribe(({ target }) => {
          console.log('tree drag');
          const olitem: HTMLOListElement  = <HTMLOListElement>target;
          
          //console.log(olitem)
          const span = olitem.querySelector('span')
          //console.log(span.id);
          this.dropItemIndex = parseInt(span.id);
          

          const liitem: HTMLLIElement = <HTMLLIElement>olitem.parentNode.parentNode;
          //console.log(liitem)
          const spanli = liitem.querySelector('span')
          //console.log(span.id);
          this.dropItemParentIndex = parseInt(spanli.id);
      }));

      sub3.add(dragEnd.subscribe((e: any) => {
        e.preventDefault();
        console.log('tree drag end grid');
        
        const item = this.data.items.find(item=>item.id === this.dropItemParentIndex);
        const dropItem = item.items.find(item=>item.id === this.dropItemIndex);
        item.items.splice(dropItem, 1);

        var d1 = {ProductName:dropItem.text, ProductID:dropItem.id};
        this.gridData.data.push(d1); 
      }));
    });
    
    return sub3;
  }
  
  public dataStateChange(state: State): void {
    this.state = state;
    this.gridData = process(products, this.state);
    this.currentSubscription.unsubscribe();
    this.zone.onStable.pipe(take(1))
    .subscribe(() => this.currentSubscription = this.handleDragAndDrop());
  }
  public rowCallback(context: RowClassArgs) {
    return {
      dragging: context.dataItem.dragging
    };
  }
  private handleDragAndDrop(): Subscription {
    const sub = new Subscription(() => {});
    //let draggedItemIndex;
    const tableRows = Array.from(document.querySelectorAll('.k-grid tr'));
    tableRows.forEach(item => {
      this.renderer.setAttribute(item, 'draggable', 'true');
      const dragStart = fromEvent<DragEvent>(item, 'dragstart');
      const dragOver = fromEvent(item, 'dragover');
      const dragEnd = fromEvent(item, 'dragend');
      sub.add(dragStart.pipe(
        tap(({ dataTransfer }) => {
          try {
            const dragImgEl = document.createElement('span');
            dragImgEl.setAttribute('style', 'position: absolute; display: block; top: 0; left: 0; width: 0; height: 0;');
            document.body.appendChild(dragImgEl);
            dataTransfer.setDragImage(dragImgEl, 0, 0);
          } catch (err) {
          // IE doesn't support setDragImage
          }
          try {
          // Firefox won't drag without setting data
            dataTransfer.setData('application/json', '');
          } catch (err) {
          // IE doesn't support MIME types in setData
          }
          })
        ).subscribe(({ target }) => {
          //console.log(this.mySelection);
          const row: HTMLTableRowElement = <HTMLTableRowElement>target;
          const index = row.rowIndex;
          const dataItem = this.gridData.data[index];
          dataItem.dragging = true;
          this.draggedItemIndex = index;
         

      }));
      sub.add(dragEnd.subscribe((e: any) => {
        e.preventDefault();
        console.log('drag end grid');
        const dragItem = this.gridData.data[this.draggedItemIndex];
        dragItem.dragging = false;
        if (this.mySelection.indexOf(dragItem.ProductID) < 0)
          this.mySelection.push(dragItem.ProductID);
        //console.log(this.mySelection);
     
        this.mySelection.forEach(key =>{
          //console.log(key);
          const dataItem = this.gridData.data.find(item=>item.ProductID === key);
          //console.log(dataItem);
        
          var item = this.data.items.find(item=>item.id === this.treeindex);
          if(item){
            //console.log(item);
            var d2 = new Unit({text:dataItem.ProductName, id:key});
            item.items.push(d2);
            //var index = dataItem.index;
            
            this.gridData.data.splice(dataItem, 1);
          
          }
        });

        // this.zone.run(() =>
        //   this.gridData = process(this.prods.slice(), this.state)
        // );
        
        this.treeindex = 0;
        this.mySelection = [];
        // this.zone.run(() =>{
        //   console.log(this.handleTreeDragAndDrop3()) ; 
        //   sub.add(this.handleTreeDragAndDrop3());
        //   }
        // );
        
      }));

      sub.add(dragOver.subscribe((e: any) => {
        e.preventDefault();
        
        
        console.log('grid drag over');
       
     
      }));
       
      
      //sub.add(this.handleTreeDragAndDrop3());
    });
    return sub;
  }


  }
  
