class Node {
  constructor(value) {
    this.value = value
    this.next = null
  }
}

export class LinkedList {
  constructor(initialValues = []) {
    if (!Array.isArray(initialValues)) {
      throw new TypeError('Dữ liệu khởi tạo phải là một mảng.')
    }

    this.head = null
    this.size = 0

    for (const value of initialValues) {
      this.append(value)
    }
  }

  validateValue(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError('Giá trị phải là một số hữu hạn.')
    }
  }

  validateIndex(index, allowEnd = false) {
    const maxIndex = allowEnd ? this.size : this.size - 1

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > maxIndex
    ) {
      throw new RangeError('Vị trí không hợp lệ.')
    }
  }

  append(value) {
    this.validateValue(value)

    const newNode = new Node(value)

    if (this.head === null) {
      this.head = newNode
    } else {
      let current = this.head

      while (current.next !== null) {
        current = current.next
      }

      current.next = newNode
    }

    this.size += 1
    return this.toArray()
  }

  prepend(value) {
    this.validateValue(value)

    const newNode = new Node(value)
    newNode.next = this.head
    this.head = newNode
    this.size += 1

    return this.toArray()
  }

  insertAt(index, value) {
    this.validateValue(value)
    this.validateIndex(index, true)

    if (index === 0) {
      return this.prepend(value)
    }

    if (index === this.size) {
      return this.append(value)
    }

    let current = this.head

    for (let i = 0; i < index - 1; i += 1) {
      current = current.next
    }

    const newNode = new Node(value)
    newNode.next = current.next
    current.next = newNode
    this.size += 1

    return this.toArray()
  }

  removeAt(index) {
    this.validateIndex(index)

    let removedNode

    if (index === 0) {
      removedNode = this.head
      this.head = this.head.next
    } else {
      let current = this.head

      for (let i = 0; i < index - 1; i += 1) {
        current = current.next
      }

      removedNode = current.next
      current.next = removedNode.next
    }

    this.size -= 1

    return {
      removedValue: removedNode.value,
      values: this.toArray(),
    }
  }

  find(value) {
    this.validateValue(value)

    let current = this.head
    let index = 0

    while (current !== null) {
      if (current.value === value) {
        return index
      }

      current = current.next
      index += 1
    }

    return -1
  }

  getAt(index) {
    this.validateIndex(index)

    let current = this.head

    for (let i = 0; i < index; i += 1) {
      current = current.next
    }

    return current.value
  }

  toArray() {
    const values = []
    let current = this.head

    while (current !== null) {
      values.push(current.value)
      current = current.next
    }

    return values
  }

  clear() {
    this.head = null
    this.size = 0

    return []
  }

  getSize() {
    return this.size
  }

  isEmpty() {
    return this.head === null
  }
}