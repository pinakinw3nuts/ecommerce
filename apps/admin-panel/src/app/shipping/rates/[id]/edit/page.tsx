"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import Select from "react-select";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/hooks/useToast";
import { shippingApi } from "@/lib/shipping-api-client";
import { ShippingRate } from "@/types/shipping";

const shippingRateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rate: z.coerce.number().min(0, "Rate must be non-negative"),
  shippingMethodId: z.string().min(1, "Shipping method is required"),
  shippingZoneId: z.string().min(1, "Shipping zone is required"),
  minWeight: z.coerce.number().min(0, "Min weight must be non-negative").default(0),
  maxWeight: z.coerce.number().min(0, "Max weight must be non-negative").default(0),
  minOrderValue: z.coerce.number().min(0, "Min order value must be non-negative").default(0),
  maxOrderValue: z.coerce.number().min(0, "Max order value must be non-negative").default(0),
  estimatedDays: z.coerce.number().min(0, "Estimated days must be non-negative").default(0),
  conditions: z.object({
    productCategories: z.array(z.string()).default([]),
    customerGroups: z.array(z.string()).default([]),
    weekdays: z.array(z.number()).default([]),
    timeRanges: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
  }).default({ productCategories: [], customerGroups: [], weekdays: [], timeRanges: [] }),
  isActive: z.boolean().default(true),
});

type ShippingRateFormValues = z.infer<typeof shippingRateSchema>;

export default function EditShippingRatePage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const id = params?.id as string;

  const { data: methodsData } = useSWR("shippingMethods", () => shippingApi.listShippingMethods({}, { page: 1, limit: 100 }));
  const { data: zonesData } = useSWR("shippingZones", () => shippingApi.listShippingZones({}, { page: 1, limit: 100 }));
  const { data: rateData, isLoading } = useSWR(id ? ["shippingRate", id] : null, () => shippingApi.getShippingRate(id));

  const methodOptions = methodsData?.methods.map(m => ({ value: m.id, label: m.name })) || [];
  const zoneOptions = zonesData?.zones.map(z => ({ value: z.id, label: z.name })) || [];

  // Dummy options for categories and groups (replace with real data as needed)
  const categoryOptions = [
    { value: "cat1", label: "Category 1" },
    { value: "cat2", label: "Category 2" },
  ];
  const groupOptions = [
    { value: "group1", label: "Group 1" },
    { value: "group2", label: "Group 2" },
  ];
  const weekdayOptions = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
  } = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRateSchema),
    defaultValues: {
      isActive: true,
      minWeight: 0,
      maxWeight: 0,
      minOrderValue: 0,
      maxOrderValue: 0,
      estimatedDays: 0,
      conditions: { productCategories: [], customerGroups: [], weekdays: [], timeRanges: [] },
    },
  });

  // Local state for conditions multi-selects and time ranges
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [customerGroups, setCustomerGroups] = useState<string[]>([]);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [timeRanges, setTimeRanges] = useState<{ start: string; end: string }[]>([]);

  // Sync local state to form
  useEffect(() => {
    setValue("conditions.productCategories", productCategories);
  }, [productCategories, setValue]);
  useEffect(() => {
    setValue("conditions.customerGroups", customerGroups);
  }, [customerGroups, setValue]);
  useEffect(() => {
    setValue("conditions.weekdays", weekdays);
  }, [weekdays, setValue]);
  useEffect(() => {
    setValue("conditions.timeRanges", timeRanges);
  }, [timeRanges, setValue]);

  // Populate form with existing data
  useEffect(() => {
    if (rateData) {
      reset({
        ...rateData,
        minWeight: rateData.minWeight ?? 0,
        maxWeight: rateData.maxWeight ?? 0,
        minOrderValue: rateData.minOrderValue ?? 0,
        maxOrderValue: rateData.maxOrderValue ?? 0,
        estimatedDays: rateData.estimatedDays ?? 0,
        conditions: {
          productCategories: rateData.conditions?.productCategories || [],
          customerGroups: rateData.conditions?.customerGroups || [],
          weekdays: rateData.conditions?.weekdays || [],
          timeRanges: rateData.conditions?.timeRanges || [],
        },
      });
      setProductCategories(rateData.conditions?.productCategories || []);
      setCustomerGroups(rateData.conditions?.customerGroups || []);
      setWeekdays(rateData.conditions?.weekdays || []);
      setTimeRanges(rateData.conditions?.timeRanges || []);
    }
  }, [rateData, reset]);

  const onSubmit = async (data: ShippingRateFormValues) => {
    try {
      await shippingApi.updateShippingRate(id, data as Partial<ShippingRate>);
      toast.success("Shipping rate updated successfully");
      router.push("/shipping/rates");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (!rateData) {
    return <div className="p-8 text-center text-red-500">Shipping rate not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Shipping Rate</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="rate">Rate</Label>
          <Input id="rate" type="number" step="0.01" {...register("rate")} />
          {errors.rate && <p className="text-red-500 text-sm">{errors.rate.message}</p>}
        </div>
        <div>
          <Label>Shipping Method</Label>
          <Controller
            name="shippingMethodId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={methodOptions}
                value={methodOptions.find(o => o.value === field.value)}
                onChange={val => field.onChange(val?.value)}
              />
            )}
          />
          {errors.shippingMethodId && <p className="text-red-500 text-sm">{errors.shippingMethodId.message}</p>}
        </div>
        <div>
          <Label>Shipping Zone</Label>
          <Controller
            name="shippingZoneId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={zoneOptions}
                value={zoneOptions.find(o => o.value === field.value)}
                onChange={val => field.onChange(val?.value)}
              />
            )}
          />
          {errors.shippingZoneId && <p className="text-red-500 text-sm">{errors.shippingZoneId.message}</p>}
        </div>
        <div>
          <Label htmlFor="minWeight">Min Weight</Label>
          <Input id="minWeight" type="number" step="0.01" {...register("minWeight")} />
          {errors.minWeight && <p className="text-red-500 text-sm">{errors.minWeight.message}</p>}
        </div>
        <div>
          <Label htmlFor="maxWeight">Max Weight</Label>
          <Input id="maxWeight" type="number" step="0.01" {...register("maxWeight")} />
          {errors.maxWeight && <p className="text-red-500 text-sm">{errors.maxWeight.message}</p>}
        </div>
        <div>
          <Label htmlFor="minOrderValue">Min Order Value</Label>
          <Input id="minOrderValue" type="number" step="0.01" {...register("minOrderValue")} />
          {errors.minOrderValue && <p className="text-red-500 text-sm">{errors.minOrderValue.message}</p>}
        </div>
        <div>
          <Label htmlFor="maxOrderValue">Max Order Value</Label>
          <Input id="maxOrderValue" type="number" step="0.01" {...register("maxOrderValue")} />
          {errors.maxOrderValue && <p className="text-red-500 text-sm">{errors.maxOrderValue.message}</p>}
        </div>
        <div>
          <Label htmlFor="estimatedDays">Estimated Days</Label>
          <Input id="estimatedDays" type="number" {...register("estimatedDays")} />
          {errors.estimatedDays && <p className="text-red-500 text-sm">{errors.estimatedDays.message}</p>}
        </div>
        <div>
          <Label>Product Categories</Label>
          <Select
            isMulti
            options={categoryOptions}
            value={categoryOptions.filter(o => productCategories.includes(o.value))}
            onChange={vals => setProductCategories(vals.map(v => v.value))}
          />
        </div>
        <div>
          <Label>Customer Groups</Label>
          <Select
            isMulti
            options={groupOptions}
            value={groupOptions.filter(o => customerGroups.includes(o.value))}
            onChange={vals => setCustomerGroups(vals.map(v => v.value))}
          />
        </div>
        <div>
          <Label>Weekdays</Label>
          <Select
            isMulti
            options={weekdayOptions}
            value={weekdayOptions.filter(o => weekdays.includes(o.value))}
            onChange={vals => setWeekdays(vals.map(v => v.value))}
          />
        </div>
        <div>
          <Label>Time Ranges</Label>
          {timeRanges.map((tr, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <Input
                type="time"
                value={tr.start}
                onChange={e => {
                  const newRanges = [...timeRanges];
                  newRanges[idx].start = e.target.value;
                  setTimeRanges(newRanges);
                }}
              />
              <span>to</span>
              <Input
                type="time"
                value={tr.end}
                onChange={e => {
                  const newRanges = [...timeRanges];
                  newRanges[idx].end = e.target.value;
                  setTimeRanges(newRanges);
                }}
              />
              <Button type="button" variant="outline" onClick={() => setTimeRanges(r => r.filter((_, i) => i !== idx))}>Remove</Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setTimeRanges(r => [...r, { start: '', end: '' }])}>Add Time Range</Button>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
} 