import className from '@/config/class-name'

export interface UiControlsOptions {
  onCommand?: (cmd: string) => void
}

export function initUiControls(
  sideExpandBtn: HTMLElement,
  goTopBtn: HTMLElement,
  mdBody: HTMLElement,
  mdSide: HTMLElement,
  options: UiControlsOptions = {},
) {
  // Side expand/collapse
  sideExpandBtn.addEventListener('click', () => onToggleSide(mdBody, mdSide))

  // Go top
  goTopBtn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' }),
  )

  // More options menu
  const moreTrigger = document.querySelector(
    '.mdr-more__trigger',
  ) as HTMLElement
  const moreMenu = document.querySelector('.mdr-more__menu') as HTMLElement
  if (moreTrigger && moreMenu) {
    moreTrigger.addEventListener('click', e => {
      e.stopPropagation()
      const visible = moreMenu.style.display !== 'none'
      moreMenu.style.display = visible ? 'none' : ''
    })

    // Close on click outside
    document.addEventListener('click', () => {
      moreMenu.style.display = 'none'
    })
    moreMenu.addEventListener('click', e => e.stopPropagation())

    // Menu actions
    moreMenu.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest(
        '.mdr-more__item',
      ) as HTMLElement
      if (!btn) return
      const action = btn.dataset.action
      moreMenu.style.display = 'none'

      switch (action) {
        case 'toggle-raw': {
          const isRaw = mdBody.style.display === 'none'
          mdBody.style.display = isRaw ? '' : 'none'
          mdSide.style.display = isRaw ? '' : 'none'
          break
        }
        case 'toggle-fullscreen': {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
          break
        }
        case 'print': {
          window.print()
          break
        }
        case 'settings': {
          options.onCommand?.('settings')
          break
        }
      }
    })
  }
}

function onToggleSide(mdBody: HTMLElement, mdSide: HTMLElement) {
  const body = document.body
  if (window.innerWidth <= 960) {
    const expanded = body.classList.toggle(className.SIDE_EXPANDED)
    if (expanded) {
      const foldSide = (e: Event) => {
        if (e.type === 'keydown' && (e as KeyboardEvent).code !== 'Escape')
          return
        body.classList.remove(className.SIDE_EXPANDED)
        mdBody.removeEventListener('click', foldSide, true)
        window.removeEventListener('resize', foldSide)
        document.removeEventListener('keydown', foldSide)
        e.stopPropagation()
        e.preventDefault()
      }
      setTimeout(() => {
        mdBody.addEventListener('click', foldSide, {
          capture: true,
          once: true,
        })
        window.addEventListener('resize', foldSide, { once: true })
        document.addEventListener('keydown', foldSide, { once: true })
      }, 0)
    }
  } else {
    body.classList.toggle(className.SIDE_COLLAPSED)
  }
}
