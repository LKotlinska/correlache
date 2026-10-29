import { FormControl } from '@angular/forms';

/** Adds `id` to the control's selected ids when checked, removes it otherwise. */
export function toggleId(control: FormControl<number[]>, id: number, checked: boolean) {
  const currentIds = control.value;
  control.setValue(checked ? [...currentIds, id] : currentIds.filter((x) => x !== id));
}
