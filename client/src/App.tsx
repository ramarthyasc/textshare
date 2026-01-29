import { useForm } from "react-hook-form";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "./components/mode-toggle";
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react";

type FormValues = {
    max_views?: number,
    ttl_seconds?: number,
    content: string,
}

function App() {

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        defaultValues: { max_views: undefined, ttl_seconds: undefined },
        mode: "onChange"
    })
    const [shareUrl, setShareUrl] = useState("https://");
    const [blink, setBlink] = useState(false);

    useEffect(() => {
        if (shareUrl !== "https://") {
            setBlink(true);
        }
    }, [shareUrl])

    async function onSubmit(data: FormValues) {
        const SERVER_URL = import.meta.env.VITE_SERVER_URL;
        try {
            const res = await fetch(`${SERVER_URL}/api/pastes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (res.ok) {
                const obj = await res.json();
                setShareUrl(obj.url);
            }
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex justify-center">
                <div className="relative w-100 md:w-300">
                    <div className="absolute left-90 top-5 md:left-290">
                        <ModeToggle />
                    </div>


                    <form action="submit" onSubmit={handleSubmit(onSubmit)}>
                        <Field className="mt-5">
                            <FieldLabel htmlFor="textarea-message" className="text-2xl font-bold">New Paste</FieldLabel>
                            <Textarea className="h-100" id="textarea-message" placeholder="Type your paste here."
                                {...register("content", {
                                    required: "Content is required",
                                })}
                            />
                            <FieldDescription className="text-red-700">
                                {errors.content?.message}
                            </FieldDescription>
                            <div className="flex">
                                {/* Expire */}
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="fieldgroup-expire">Paste Expiration (Seconds):</FieldLabel>
                                        <div>
                                            <Input
                                                className="w-80" type="number" id="fieldgroup-expire"
                                                placeholder="Enter a Positive integer"
                                                {...register("ttl_seconds", {
                                                    setValueAs: (v) => (v === "" || Number.isNaN(v) ? undefined : Number(v)),
                                                    validate: (value) => {
                                                        if (value === undefined) { return true; }
                                                        if (!Number.isInteger(value)) { return "Must be an integer"; }
                                                        if (value <= 0) { return "Must be greater than 0"; }
                                                        return true;
                                                    }
                                                })}
                                            />
                                        </div>
                                        <FieldDescription className="text-red-700">
                                            {errors.ttl_seconds?.message}
                                        </FieldDescription>
                                    </Field>
                                    {/* View */}
                                    <Field>
                                        <FieldLabel htmlFor="fieldgroup-integer">Paste View limit:</FieldLabel>
                                        <div>
                                            <Input
                                                id="fieldgroup-integer"
                                                type="number"
                                                placeholder="Enter a Positive Integer"
                                                className="w-80"
                                                {...register("max_views", {
                                                    setValueAs: (v) => (v === "" || Number.isNaN(v) ? undefined : Number(v)),
                                                    validate: (value) => {
                                                        if (value === undefined) { return true; }
                                                        if (!Number.isInteger(value)) { return "Must be an integer"; }
                                                        if (value <= 0) { return "Must be greater than 0"; }
                                                        return true;
                                                    }
                                                })}
                                            />
                                        </div>
                                        <FieldDescription className="text-red-700">
                                            {errors.max_views && errors.max_views.message}
                                        </FieldDescription>
                                    </Field>

                                    {/* Submit */}
                                    <Field orientation="horizontal">
                                        <Button type="reset" variant="outline">
                                            Reset
                                        </Button>
                                        <Button type="submit" className="font-bold">Create New Paste</Button>
                                    </Field>
                                </FieldGroup>
                                {/* <div> */}
                                {/*     <Button className="font-bold">Create New Paste</Button> */}
                                {/* </div> */}

                                <div>
                                    <Field>
                                        <div className="flex">
                                            <div className="w-35 mt-2">
                                                <FieldLabel htmlFor="fieldgroup-link">Shareable Link :</FieldLabel>
                                            </div>
                                            <div>
                                                <Input
                                                    id="fieldgroup-link"
                                                    value={shareUrl}
                                                    readOnly
                                                    type="text"
                                                    placeholder="Enter a Positive Integer"
                                                    onClick={(e) => e.currentTarget.select()}
                                                    onMouseEnter={() => setBlink(false)}
                                                    className="bg-gray-100 dark:bg-stone-600"
                                                />
                                                <div className="flex w-80 justify-end">
                                                    <Button type="button"
                                                        onMouseEnter={() => setBlink(false)}
                                                        className={`mt-2 py-0 dark:bg-violet-400 dark:hover:bg-violet-300
                                                        ${blink ? "bg-green-400 dark:bg-green-400" : ""}`}
                                                        onClick={() => navigator.clipboard.writeText(shareUrl)}>
                                                        Copy url
                                                    </Button>

                                                </div>
                                            </div>
                                        </div>
                                    </Field>
                                </div>
                            </div>
                        </Field>

                    </form>

                </div>
            </div>
        </ThemeProvider>
    )
}

export default App
