import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterbrandComponent } from './footerbrand.component';

describe('FooterbrandComponent', () => {
  let component: FooterbrandComponent;
  let fixture: ComponentFixture<FooterbrandComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FooterbrandComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterbrandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
