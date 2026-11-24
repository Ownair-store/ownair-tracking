import TrackingApp from "../../../components/TrackingApp";

export default function TrackPage({ params }) {
  return <TrackingApp initialAwb={params.awb} />;
}
