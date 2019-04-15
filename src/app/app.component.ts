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
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
  styles: [`
      .k-grid .k-grid-content tr.hide-row {
        display: none;
      }
    `]
})

export class AppComponent implements AfterViewInit, OnDestroy {
  private prods = products;
  // private prodsCopy = JSON.parse(JSON.stringify(this.prods));
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
  private subMap: Map<number, Subscription> = new Map();

  public state: State = {
    skip: 0,
    take: 10,
    sort: [{ field: 'ProductID', dir: 'asc' }],
  };
  public gridData: any;
  private isGridOrTree = true;

  private currentSubscription: Subscription;
  constructor(private renderer: Renderer2, private zone: NgZone, private ref: ChangeDetectorRef) {
    this.prods.forEach(p => p.Discontinued = false);
    this.gridData = process(this.prods, this.state);
  }
  public ngAfterViewInit(): void {
    this.currentSubscription = this.handleDragAndDrop_grid();
    this.currentSubscription.add(this.handleDragAndDrop_Li());
    // this.currentSubscription.add(this.handleTreeDragAndDrop3());

  }

  public toggle(data: Unit): void {
    // console.log(data);
    data.isToggle = !data.isToggle;
  }

  public ngOnDestroy(): void {
    this.currentSubscription.unsubscribe();
  }

  public rowCallback(context: RowClassArgs) {
    // console.log(context.dataItem);
    return {
        'hide-row': context.dataItem.Discontinued
    };
}

  onDomChange($event: MutationRecord): void {
    // console.log($event);
    const ul = $event.target as Element;
    // console.log(ul.childElementCount);
    if (ul.childElementCount) {
      const addedNodes = $event.addedNodes;
      const removeNodes = $event.removedNodes;
      console.log($event);
      if (addedNodes.length > 0) {
        const li = ul.parentElement;
        // console.log(li);
        const span = li.querySelector('span');
        // console.log(span.id);
        const id = parseInt(span.id, 0);
        const sub = this.handleDragAndDrop_Ol(ul);
        this.subMap.set(id, sub);
        this.currentSubscription.add(sub);
      }
      if (removeNodes.length > 0) {
        console.log(removeNodes);
        const li = ul.parentElement;
        // console.log(li);
        const span = li.querySelector('span');
        // console.log(span.id);
        const id = parseInt(span.id, 0);
        const sub = this.subMap.get(id);
        console.log(sub);
        sub.unsubscribe();
        this.currentSubscription.remove(sub);
      }
    }

  }

  private handleDragAndDrop_Li(): Subscription {
    const sub = new Subscription(() => {});
    // let draggedItemIndex;
    const tableRows = Array.from(document.querySelectorAll('#menu li'));

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
        const id = parseInt(span.id, 0);
        if (id >= 1000) {
          this.treeindex = id;
        }

        this.isGridOrTree = false;
    }));
    return sub;
  }


  private handleDragAndDrop_Ol(container: Element): Subscription {
    // console.log('handleTreeDragAndDrop3')
    const sub = new Subscription(() => {});
    // let draggedItemIndex;

    const tableRows = Array.from(container.querySelectorAll('li'));
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
          dataTransfer.setData('application/json', 'tree');
        } catch (err) {
        // IE doesn't support MIME types in setData
        }
        })
      ).subscribe(({ target }) => {
        console.log('tree drag');
        const olitem: HTMLLIElement  = target as HTMLLIElement;

        // console.log(olitem)
        const span = olitem.querySelector('span');
        // onsole.log(span.id);
        this.dropItemIndex = parseInt(span.id, 0);
        const liitem: HTMLLIElement = olitem.parentNode.parentNode as HTMLLIElement;
        // console.log(liitem)
        const spanli = liitem.querySelector('span');
        // console.log(span.id);
        this.dropItemParentIndex = parseInt(spanli.id, 0);
        this.isGridOrTree = false;
    }));

    sub.add(dragEnd.subscribe((e: any) => {
      e.preventDefault();
      console.log('tree drag end grid');
      // console.log(this.isGridOrTree);
      // console.log(this.treeindex);
      // const dragType = dv.getData('application/json');
      // console.log(dragType);
      // console.log(this.dropItemParentIndex);
      // console.log(this.dropItemIndex);
      if (this.dropItemParentIndex === -1 || this.dropItemIndex === -1) {
        return;
      }
      if (this.treeindex === -1) {
        return;
      }
      const liitem: Unit = this.data.items.find(li => li.id === this.dropItemParentIndex);
      const dropItem: any = liitem.items.find(ol => ol.id === this.dropItemIndex);

      if (this.isGridOrTree) {
        console.log('move to grid');
        const d1 = this.prods.find(p => p.ProductID === this.dropItemIndex);
        d1.Discontinued = false;
      } else {
        console.log('move to tree');
        const newDataItem: Unit = this.data.items.find(li => li.id === this.treeindex);
        // console.log(newDataItem);
        const d2 = new Unit({text: dropItem.text, id: this.dropItemIndex});
        newDataItem.items.push(d2);
        // console.log(newDataItem);
      }
      const dropindex = liitem.items.findIndex(l => l.id === this.dropItemIndex);
      liitem.items.splice(dropindex, 1);
      console.log(liitem);
      this.dropItemParentIndex = -1;
      this.dropItemIndex = -1;
      this.treeindex = -1;
      // this.ref.detectChanges();
    }));
    return sub;
  }


  public dataStateChange(state: State): void {
    console.log('grid change');
    this.state = state;
    this.gridData = process(products, this.state);
    this.currentSubscription.unsubscribe();
    this.zone.onStable.pipe(take(1))
    .subscribe(() => this.currentSubscription = this.handleDragAndDrop_grid());
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
            dataTransfer.setData('application/json', 'grid');
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
      this.isGridOrTree = true;
    }));

    sub.add(this.handleDrop_grid(dragEnd));

    sub.add(dragOver.subscribe((e: any) => {
        e.preventDefault();
        console.log('grid drag over');
        this.isGridOrTree = true;
        // const tr: HTMLTableRowElement = e.target as HTMLTableRowElement;
        // this.draggedItemIndex = tr.rowIndex;
      }));

    return sub;
  }

  private handleDrop_grid(event: Observable<Event>): Subscription {
    const sub = event.subscribe((e: any) => {
      e.preventDefault();
      console.log('drag end grid');
      // console.log(this.isGridOrTree);

      // const dragType = dv.getDate('application/json');
      // console.log(dragType);
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
          // const dataItem2Index = this.prods.findIndex(d => d.ProductID === dataItem2.ProductID);
          dataItem2.Discontinued = true;
          // this.prods.splice(dataItem2Index, 1);
          // this.remove_gridRows.push(dataItem);
          // console.log(this.prods);
          // this.gridData = process(this.prods, this.state);
          // console.log(this.currentSubscription);
        }
      });
      this.treeindex = -1;
      this.mySelection = [];
      this.draggedItemIndex = -1;
      // this.ref.detectChanges();
      // this.zone.run(() =>
      //   this.gridData = process(this.prods, this.state)
      // );
      // this.refreshDragAndDrop();
    });
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
