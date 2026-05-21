import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArefBackgroundComponent } from './aref-background.component';

describe('ArefBackgroundComponent', () => {
  let component: ArefBackgroundComponent;
  let fixture: ComponentFixture<ArefBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArefBackgroundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArefBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
