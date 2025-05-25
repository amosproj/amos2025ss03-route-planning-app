"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
// import { toast } from "@/components/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useDispatch, useSelector } from "react-redux"
import { setRouteData } from "@/store/dailyRouteSlice"
import dailyPlanData from "../../testData/dailyPlanData.json"
import { RootState } from "@/store"
import { useEffect, useState } from "react"


const FormSchema = z.object({
    date: z.date({
        required_error: "A date is required.",
    }),
    solution: z.enum(["solution1", "solution2", "solution3"], {
        required_error: "Please select a solution.",
    }),
})

export function DailyRouteForm({ setDailyPlanData }) {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            date: new Date(),
            solution: 'solution1', // Default solution, can be changed later
        },
    })

    const dispatch = useDispatch()
    const handleSave = () => {
        const rawDate = new Date()
        const solutionKey = "solution1" // This should be dynamic based on the selected solution

        const formattedDate = format(rawDate, "dd-MM-yyyy")

        dispatch(
            setRouteData({
                date: formattedDate,
                solutionKey,
                data: dailyPlanData,
            })
        )

    }

    const dailyRoute = useSelector((state: RootState) => state.dailyRoute)
    const [solutions, setSolutions] = useState<string[]>([])

    useEffect(() => {
        const currentDate = format(new Date(), "dd-MM-yyyy")
        setSolutions(Object.keys(dailyRoute[currentDate] || []))

    }, [dailyRoute])

    function onSubmit(data: z.infer<typeof FormSchema>) {
        const formattedDate = format(data.date, "dd-MM-yyyy");
        const solutionKey = data.solution;
        const solutionData = dailyRoute[formattedDate]?.[solutionKey] || [];
        setDailyPlanData(solutionData);
        console.log("solutionData", solutionData)
    }

    return (
        <div>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-row items-end space-x-4 p-4"
                >
                    {/* Date Picker */}
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[200px] pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Dropdown */}
                    <FormField
                        control={form.control}
                        name="solution"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Solution</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Select a solution" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {solutions.map((solution) => (
                                            <SelectItem key={solution} value={solution}>
                                                {solution}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Load Button */}
                    <Button type="submit">Load</Button>
                </form>
            </Form>

            <Button type="button" variant="secondary" onClick={handleSave}>
                Save
            </Button>
        </div>
    )
}
