import { State, process } from '@progress/kendo-data-query';
import { Component, Renderer2, NgZone, AfterViewInit, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { RowClassArgs, SelectableSettings, RowArgs  } from '@progress/kendo-angular-grid';
import { products } from './products';
import { Unit, unit } from './units';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { take } from 'rxjs/operators/take';
import { tap } from 'rxjs/operators/tap';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { of } from 'rxjs/observable/of';


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
  private prodsCopy = JSON.parse(JSON.stringify(this.prods));
  public data: Unit = unit;
  public mode = 'multiple';
  public selectableSettings: SelectableSettings = {
    mode: 'multiple'
};
  public mySelection: number[] = [];
  private draggedItemIndex: number;
  private dropItemIndex: number;
  private dropItemParentIndex: number;
  private treeindex: number;
  public state: State = {
    skip: 0,
    take: 10,
    sort: [{ field: 'ProductID', dir: 'asc' }],
  };
  public gridData: any = process(this.prods, this.state);
  private remove_gridRows: any[] = [];
  private currentSubscription: Subscription;
  constructor(private renderer: Renderer2, private zone: NgZone, private ref: ChangeDetectorRef) { }
  public ngAfterViewInit(): void {
    this.currentSubscription = this.handleDragAndDrop_grid();
    this.currentSubscription.add(this.handleDragAndDrop_Li());
    // this.currentSubscription.add(this.handleTreeDragAndDrop3());
  }

  public ngOnDestroy(): void {
    this.currentSubscription.unsubscribe();
  }

  private handleDragAndDrop_Li(): Subscription {
    const sub = new Subscription(() => {});
    // let draggedItemIndex;
    const container = document.querySelector('#test1');
    const tableRows = Array.from(container.querySelectorAll('li'));

    tableRows.forEach(row => {
      // console.log(item);
      sub.add(this.handleDragAndDrop_LiItem(row));
    });

    return sub;
  }

  private handleDragAndDrop_LiItem(row: Element): Subscription {
    const sub = new Subscription(() => {});
    const dragOver = fromEvent(row, 'dragover');

    sub.add(dragOver.subscribe((e: any) => {
        e.preventDefault();

        const liitem: HTMLLIElement = e.target as HTMLLIElement;
        const span = liitem.querySelector('span');
        // console.log(span.id);
        this.treeindex = parseInt(span.id, 0);
        }));
    return sub;
  }

  myChange() {
    console.log('my change');
    this.currentSubscription.add(this.handleDragAndDrop_Ol());
  }
  private handleDragAndDrop_Ol(): Subscription {
    // console.log('handleTreeDragAndDrop3')
    const sub = new Subscription(() => {});
    // let draggedItemIndex;
    const container = document.querySelector('#test1');

    const tableRows = Array.from(container.querySelectorAll('ol'));
    // console.log(tableRows)
    tableRows.forEach(row => {
      // console.log(item);
      sub.add(this.handleDragAndDrop_OlItem(row));
    });

    return sub;
  }

  private handleDragAndDrop_OlItem(row: Element): Subscription {
    const sub = new Subscription(() => {});
    this.renderer.setAttribute(row, 'draggable', 'true');
    const dragStart = fromEvent<DragEvent>(row, 'dragstart');
    const dragEnd = fromEvent(row, 'dragend');
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
        console.log('tree drag');
        const olitem: HTMLOListElement  = target as HTMLOListElement;

        // console.log(olitem)
        const span = olitem.querySelector('span');
        // onsole.log(span.id);
        this.dropItemIndex = parseInt(span.id, 0);
        const liitem: HTMLLIElement = olitem.parentNode.parentNode as HTMLLIElement;
        // console.log(liitem)
        const spanli = liitem.querySelector('span');
        // console.log(span.id);
        this.dropItemParentIndex = parseInt(spanli.id, 0);
    }));

    sub.add(dragEnd.subscribe((e: any) => {
      e.preventDefault();
      console.log('tree drag end grid');
      console.log(this.dropItemParentIndex);
      console.log(this.dropItemIndex);
      if (this.dropItemParentIndex === -1 || this.dropItemIndex === -1) {
        return;
      }
      const liitem: Unit = this.data.items.find(li => li.id === this.dropItemParentIndex);
      const dropItem: any = liitem.items.find(ol => ol.id === this.dropItemIndex);
      // const d1 = {ProductName: dropItem.text, ProductID: dropItem.id};
      const d1 = this.prodsCopy.find(p => p.ProductID === this.dropItemIndex);
      const d2 = JSON.parse(JSON.stringify(d1));
      // const d1 = this.remove_gridRows.find(p => p.ProductID === dropItem.id);
      // console.log(d1);
      // console.log(this.prods);
      this.prods.push(d2);
      // console.log(this.prods);
      // this.gridData.data.push(d1);
      // this.remove_gridRows.splice(d1, 1);
      this.gridData = process(this.prods, this.state);
      // this.zone.run(() =>
      //     this.gridData = process(this.prods, this.state)
      // );
      // this.refreshDragAndDrop();
      // console.log(this.currentSubscription);
      liitem.items.splice(dropItem, 1);
      this.dropItemParentIndex = -1;
      this.dropItemIndex = -1;
    }));
    return sub;
  }

  private refreshDragAndDrop(): void {
    console.log('refresh drag and drop');
    this.currentSubscription.unsubscribe();
    this.currentSubscription.add(this.handleDragAndDrop_grid());
    this.currentSubscription.add(this.handleDragAndDrop_Li());
    // this.currentSubscription.add(this.handleDragAndDrop_Ol());
    console.log(this.currentSubscription);
  }

  public dataStateChange(state: State): void {
    console.log('grid change');
    this.state = state;
    this.gridData = process(products, this.state);
    this.currentSubscription.unsubscribe();
    this.zone.onStable.pipe(take(1))
    .subscribe(() => this.currentSubscription = this.handleDragAndDrop_grid());
  }
  public rowCallback(context: RowClassArgs) {
    return {
      dragging: context.dataItem.dragging
    };
  }

  private handleDragAndDrop_gridRow(row: Element): Subscription {
    const sub = new Subscription(() => {});
    this.renderer.setAttribute(row, 'draggable', 'true');
    const dragStart = fromEvent<DragEvent>(row, 'dragstart');
    const dragOver = fromEvent(row, 'dragover');
    const dragEnd = fromEvent(row, 'dragend');
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
      console.log('grid drag');
      const tr: HTMLTableRowElement = target as HTMLTableRowElement;
      this.draggedItemIndex = tr.rowIndex;
      // console.log(this.draggedItemIndex);
      const dataItem = this.gridData.data[this.draggedItemIndex];
      dataItem.dragging = true;
    }));

    sub.add(dragEnd.subscribe((e: any) => {
        e.preventDefault();
        console.log('drag end grid');
        const dragItem = this.gridData.data[this.draggedItemIndex];
        dragItem.dragging = false;
        if (this.mySelection.indexOf(dragItem.ProductID) < 0) {
          this.mySelection.push(dragItem.ProductID);
        }
        // console.log(this.mySelection);

        this.mySelection.forEach(key => {
          // console.log(key);
          // const dataItem = this.gridData.data.find(d => d.ProductID === key);
          const dataItem2: any = this.prods.find(d => d.ProductID === key);
          // console.log(dataItem);
          const liitem = this.data.items.find(li => li.id === this.treeindex);
          if (liitem) {
            // console.log(item);
            const d2 = new Unit({text: dataItem2.ProductName, id: key});
            // console.log(d2);
            liitem.items.push(d2);
            // var index = dataItem.index;
            // this.gridData.data.splice(dataItem, 1);
            // console.log(this.prods.length);
            // console.log(dataItem2);
            const dataItem2Index = this.prods.findIndex(d => d.ProductID === dataItem2.ProductID);
            this.prods.splice(dataItem2Index, 1);
            // this.remove_gridRows.push(dataItem);
            // console.log(this.prods);
            this.gridData = process(this.prods, this.state);
            // console.log(this.currentSubscription);
          }
        });
        this.treeindex = 0;
        this.mySelection = [];
        // this.draggedItemIndex = -1;
        // this.ref.detectChanges();
        // this.zone.run(() =>
        //   this.gridData = process(this.prods, this.state)
        // );
        // this.refreshDragAndDrop();
      }));

    sub.add(dragOver.subscribe((e: any) => {
        e.preventDefault();
        console.log('grid drag over');
      }));

    return sub;
  }

  private handleDragAndDrop_grid(): Subscription {
    const sub = new Subscription(() => {});
    // let draggedItemIndex;
    const tableRows = Array.from(document.querySelectorAll('.k-grid tr'));
    tableRows.forEach(item => {
        sub.add(this.handleDragAndDrop_gridRow(item));
    });
    return sub;
  }


}
