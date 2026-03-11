/**
 * Sidebar TOC: filter headings, collapse/expand tree nodes,
 * search toggle. Matches original mdr-side structure.
 */
export function initSidebar(sideEl: HTMLElement) {
  const filterInput = sideEl.querySelector(
    '.mdr-side__filter-input',
  ) as HTMLInputElement
  const searchBtn = sideEl.querySelector('.mdr-side__search-btn') as HTMLElement
  const collapseBtn = sideEl.querySelector(
    '.mdr-side__collapse-btn',
  ) as HTMLElement
  const treeEl = sideEl.querySelector('.mdr-side__tree') as HTMLElement

  if (!treeEl) return

  // Toggle individual tree nodes via chevron click
  treeEl.addEventListener('click', (e: Event) => {
    const toggle = (e.target as HTMLElement).closest(
      '.tree-node-toggle-icon',
    ) as HTMLElement
    if (!toggle) return
    e.preventDefault()
    e.stopPropagation()
    const li = toggle.closest('li')
    li.classList.toggle('collapsed')
  })

  // Collapse/expand all — toggles between states
  let allCollapsed = false
  collapseBtn?.addEventListener('click', () => {
    const expandable = treeEl.querySelectorAll('li.expandable:not(.leaf)')
    if (allCollapsed) {
      expandable.forEach(el => el.classList.remove('collapsed'))
    } else {
      expandable.forEach(el => el.classList.add('collapsed'))
    }
    allCollapsed = !allCollapsed
  })

  // Search button toggles filter visibility
  const searchDiv = sideEl.querySelector('.mdr-side__search') as HTMLElement
  searchBtn?.addEventListener('click', () => {
    const visible = searchDiv.style.display !== 'none'
    searchDiv.style.display = visible ? 'none' : ''
    if (!visible) filterInput?.focus()
    else {
      // Clear filter when hiding
      if (filterInput) filterInput.value = ''
      filterToc(treeEl, '')
    }
    searchBtn.classList.toggle('active', !visible)
  })

  // Filter headings by text match
  filterInput?.addEventListener('input', () => {
    const query = filterInput.value.toLowerCase().trim()
    filterToc(treeEl, query)
  })
}

function filterToc(treeEl: HTMLElement, query: string) {
  const allItems = treeEl.querySelectorAll('li')
  if (!query) {
    allItems.forEach(li => li.classList.remove('hidden', 'filter-match'))
    return
  }

  // Mark matches
  allItems.forEach(li => {
    const text =
      li
        .querySelector(':scope > .tree-node-item .tree-node-content')
        ?.textContent?.toLowerCase() || ''
    const matches = text.includes(query)
    li.classList.toggle('filter-match', matches)
    li.classList.toggle('hidden', !matches)
  })

  // Show parents of matched children
  allItems.forEach(li => {
    if (li.classList.contains('filter-match')) {
      let parent = li.parentElement?.closest('li')
      while (parent) {
        parent.classList.remove('hidden')
        parent.classList.remove('collapsed')
        parent = parent.parentElement?.closest('li')
      }
    }
  })
}
