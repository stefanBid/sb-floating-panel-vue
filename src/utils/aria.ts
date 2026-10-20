/**
 * Panel roles that make the reference a popup trigger, with their `aria-haspopup` value.
 * Panels with these roles are also named after the reference.
 */
export const POPUP_ROLES: Record<string, 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid'> = {
  dialog: 'dialog',
  alertdialog: 'dialog',
  menu: 'menu',
  listbox: 'listbox',
  tree: 'tree',
  grid: 'grid',
};
