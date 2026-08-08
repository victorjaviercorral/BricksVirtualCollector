import VitrinaClient from "@/components/VitrinaClient";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <VitrinaClient id={params.id} />;
}