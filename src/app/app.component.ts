import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

@Component({
    selector: 'moo-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public userCardNumber = new BehaviorSubject<string>('');
    private _sub!: Subscription;

    public ngOnInit(): void {
        this._sub = new Subscription();
    }

    public handleFakeNumberInput(event: Event): void {
        const _target = event.target as HTMLInputElement;
        this.userCardNumber.next( _target.value || '' );
    }

    public ngOnDestroy(): void {
        this._sub.unsubscribe();
    }
}
