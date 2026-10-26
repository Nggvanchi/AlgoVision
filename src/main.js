import './style.css'
import { initSearching } from './searching.js'
import { initSorting } from './sorting.js'
import { initNavigation } from './navigation.js'
import { initArray } from './array.js'
import { initStack } from './stack.js'
import { initQueue } from './queue.js'
import { initLinkedList } from './linked-list.js'

const app = document.querySelector('#app')

async function loadAppTemplate() {
  const response = await fetch('/templates/app.html')

  if (!response.ok) {
    throw new Error(`Không thể tải giao diện: ${response.status}`)
  }

  app.innerHTML = await response.text()
}

await loadAppTemplate()

initNavigation(document)
initSorting()
initSearching()
initArray()
initStack()
initQueue(document)
initLinkedList(document)
