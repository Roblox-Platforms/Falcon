const STUDS_PER_METER = 3.571428571;
const METERS_PER_STUD = 1 / STUDS_PER_METER;

function studsToMeters(studs: number): number {
	return studs * METERS_PER_STUD;
}

function metersToStuds(m: number): number {
	return m * STUDS_PER_METER;
}

export { metersToStuds, studsToMeters };

