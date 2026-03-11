import throttle from 'lodash.throttle'
import { getHeads } from './utils'

const ACTIVE_CLASS = 'active'

export class ScrollTracker {
  private headElements: HTMLElement[] = []
  private sideLiElements: HTMLElement[] = []
  private targetIndex: number = null
  private isSideHover = false
  private goTopBtn: HTMLElement
  private sideTree: HTMLElement
  private mdContent: HTMLElement

  constructor(
    mdContent: HTMLElement,
    sideTree: HTMLElement,
    goTopBtn: HTMLElement,
  ) {
    this.mdContent = mdContent
    this.sideTree = sideTree
    this.goTopBtn = goTopBtn

    sideTree.addEventListener('mouseenter', () => {
      this.isSideHover = true
    })
    sideTree.addEventListener('mouseleave', () => {
      this.isSideHover = false
    })

    document.addEventListener(
      'scroll',
      throttle(() => this.onScroll(), 100),
    )
  }

  update() {
    this.headElements = getHeads(this.mdContent)
    this.sideLiElements = Array.from(this.sideTree.querySelectorAll('li'))
    this.targetIndex = null
    setTimeout(() => this.onScroll(), 0)
  }

  private onScroll() {
    const scrollTop = document.documentElement.scrollTop
    this.goTopBtn.style.display = scrollTop >= 640 ? '' : 'none'

    this.headElements.some((_, index) => {
      let sectionHeight = -20
      const next = this.headElements[index + 1]
      if (next) sectionHeight += next.offsetTop

      const hit = sectionHeight <= 0 || sectionHeight > scrollTop

      if (hit && this.targetIndex !== index) {
        const prev = this.sideLiElements[this.targetIndex]
        prev?.classList.remove(ACTIVE_CLASS)

        this.targetIndex = index
        const target = this.sideLiElements[index]
        if (target) {
          target.classList.add(ACTIVE_CLASS)
          if (!this.isSideHover && target.scrollIntoView) {
            target.scrollIntoView({ block: 'nearest' })
          }
        }
      }
      return hit
    })
  }
}
