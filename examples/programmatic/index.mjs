import { Thnk } from '../../index.js'

const THNK = new Thnk('./Thnkfile.yml')

const dataSheet = await THNK.object('dataSheet.json', {
  data: {
    product: {
      product_name: 'Wakewake X123xi laptop 275G 512SSD i7',
      stock: 7,
    },
  },
})
console.log(dataSheet)

const greeting = await THNK.text('greeting', {
  data: {
    name: 'Jacob',
    time: '9:30PM',
  },
})
console.log(greeting)
