"use client"
import { useCart } from '@/contexts/cart-context'
import { ChevronRight, X } from 'lucide-react'
import { useMemo, useState } from 'react';

interface Shipping{
    id: string;
    location: string;
    fees: number;
    selected: boolean;
}

interface Tax { 
    id:string
    name: string;
    percentage:number
}

function CartProducs() {
    const { id, products, updateCart, removeFromCart } = useCart()
    const [shippingOptions, setShippingOptions] = useState<Shipping[]>([{
        id:crypto.randomUUID(),
        location: "Fast to  Muhanga",
        fees:0,
        selected:false
    },
        {
         id:   crypto.randomUUID(),
        location: "Fast to Kigali",
        fees:0,
        selected:false
    },
        {
         id:   crypto.randomUUID(),
        location: "Rusizi",
        fees:5000,
        selected:false
    }
   
])
    const [taxes, setTaxes] = useState<Tax[]>([
        {
            id: crypto.randomUUID(),
            name: "VAT",
            percentage: 0.18

        }])

    const totals = useMemo<[number, number]>(() => {
        let netAmount = products.reduce((s, p) => {
            return (s + (p.qty * p.price))
        }, 0);
        const shippingFees = shippingOptions.filter((so => so.selected)).reduce((s, ded) => s + ded.fees, 0)
        const taxDeductions = taxes.reduce((s, ded) => s + ded.percentage, 0)
        netAmount = netAmount + shippingFees
        const totalTax= netAmount * taxDeductions
        const totalAmount= netAmount+totalTax

        return [netAmount, totalAmount]
        
    }, [products, taxes, shippingOptions])
    return (
        <div className='mx-2 flex flex-col gap-3'>
            <h1 className=" text-5xl sm:text-3xl lg:text-4xl xl:text-4xl font-bold  leading-[1.05] mb-6 max-w-2xl ">Products</h1>
            <table className='border p-4'>
                <thead className="border">
                    <td className='p-2 border'>#</td>
                    <td className='p-2 border'>Name</td>
                    <td className='p-2 border'>color</td>
                    <td className='p-2 border'>Size</td>
                    <td className='p-2 border'>qty</td>
                    <td className='p-2 border'>Price</td>
                </thead>
                <tbody>
                    {products.map((p, i) => {
                        return <tr key={p.id}>
                            <td className='p-2 border'>{i + 1}</td>
                            <td className='p-2 border'>{p.name}</td>
                            <td className='p-2 border'>{p.color}</td>
                            <td className='p-2 border'>{p.size}</td>
                            <td className='p-2 border'><input type="number" min={1} onChange={(e) => {
                                updateCart({...p, qty: Number(e.target.value)})
                            }} value={String(p.qty)} /></td>
                            <td className='p-2 border'>{p.price}</td>
                            <td className='p-2 border'> <button onClick={()=>removeFromCart(p.id)} className='border p-2 bg-destructive cursor-pointer text-accent'><X/></button></td>
                        </tr>
                    })}
                </tbody>

            </table>
            <fieldset className= "border p-3 rounded-lg">
                <legend className="font-serif text-1xl sm:text-xl lg:text-1xl xl:text-1xl font-bold  leading-[1.05] mb-6 max-w-xl ">Shipping</legend>
                <ul>
                    {shippingOptions.map((sp, i) => {
                        return <li key={i} className="flex justify-between p-2 items-center">
                            <input type="checkbox" checked={sp.selected} id={sp.location} className="h-4 w-4 text-primary" onChange={(e) => setShippingOptions([...shippingOptions.map(shipping => {
                                if (shipping.id == sp.id) {
                                    return { ...shipping, selected: e.target.checked }
                                }
                                return { ...shipping, selected: false }
                            })])} />
                            <label htmlFor={sp.location}>{sp.location} ( { sp.fees.toLocaleString()})</label>
                        </li>
                    })}
                </ul>
            </fieldset>
            

            <fieldset className="border p-3 rounded-lg">
                <legend className="font-serif text-1xl sm:text-xl lg:text-1xl xl:text-1xl font-bold  leading-[1.05] mb-6 max-w-xl ">Taxes</legend>
                <ul>
                     
                {taxes.map((tx,idx)=>{
                    return <li key={idx} className="flex justify-between p-2 items-center">
                        <div >{tx.name}</div>
                            <div >{tx.percentage *100} %</div>
                        </li>
                })}
                </ul>
            </fieldset>

            <fieldset className="border p-3 rounded-lg">
                <legend className="font-serif text-1xl sm:text-xl lg:text-1xl xl:text-1xl font-bold  leading-[1.05] mb-6 max-w-xl ">Totals</legend>
                <ul>
                     
                    <li   className="flex justify-between p-2 items-center">
                        <div >VAT incl.</div>
                        <div className="font-serif text-3xl sm:text-1xl lg:text-2xl xl:text-2xl font-bold  leading-[1.05] mb-6 max-w-1xl " >{totals[1].toLocaleString()}</div>
                    </li>
                    <li className="flex justify-between p-2 items-center">
                        <div >VAT excl.</div>
                        <div className="font-serif text-3xl sm:text-1xl lg:text-2xl xl:text-2xl font-bold  leading-[1.05] mb-6 max-w-1xl " >{totals[0].toLocaleString()}</div>
                    </li>
                </ul>
            </fieldset>


             <button
                        className="bg-primary hover:bg-accent my-2 w-full cursor-pointer  font-bold px-9 py-4 transition-all duration-300 shadow-lg flex items-center gap-3 text-sm uppercase"
                      >
                         Checkout
                         <ChevronRight/>
                      </button>
        </div>
    )
}

export default CartProducs