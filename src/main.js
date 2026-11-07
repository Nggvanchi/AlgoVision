import './style.css'
import { bootApp } from './bootstrap.js'
import { initSearching } from './searching.js'
import { initSorting } from './sorting.js'
import { initNavigation } from './navigation.js'
import { initSidebar } from './sidebar.js'
import { initProgress } from './progress-init.js'
import { initArray } from './array.js'
import { initStack } from './stack.js'
import { initQueue } from './queue.js'
import { initLinkedList } from './linked-list.js'
import { initBst } from './bst.js'
import { initHashTable } from './hash-table.js'
import { initGraph } from './graph.js'

function startApp() {
  initNavigation(document)
  initSidebar(document)
  const progress = initProgress(document)
  initSorting()
  initSearching()
  initArray()
  initStack()
  initQueue(document)
  initLinkedList(document)
  initBst(document)
  initHashTable(document)
  initGraph(document)
}

await bootApp(document.querySelector('#app'), { start: startApp })
