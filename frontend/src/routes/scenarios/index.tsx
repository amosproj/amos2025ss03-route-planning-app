import { createFileRoute } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Box, Typography, Chip, Stack, ModalDialog } from '@mui/joy';
import { useState } from 'react';
import { Card } from '@mui/joy';
import { Room } from '@mui/icons-material';
import { LocalShipping } from '@mui/icons-material';
import Modal from '@mui/joy/Modal';
import Table from '@mui/joy/Table';
import { Job } from '../../types/Job';
import { Scenario } from '../../types/Scenario';

export const Route = createFileRoute('/scenarios/')({
  component: ScenarioList,
});

function ScenarioList() {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const sorted = [...scenarios].sort((a, b) => a.date - b.date);

  // Map dates to scenarios
  const dateMap = new Map(
    sorted.map((sc) => [new Date(sc.date).toDateString(), sc]),
  );

  // Determine date range start (Monday) and end
  const minDate = new Date(Math.min(...sorted.map((sc) => sc.date)));
  const maxDate = new Date(Math.max(...sorted.map((sc) => sc.date)));
  const start = new Date(minDate);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  // Build weeks
  const weeks: Date[][] = [];
  const current = new Date(start);
  while (current <= maxDate) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <Box className="p-4">
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => (
            <Box key={day} sx={{ flex: 1 }}>
              <Typography level="h4" textAlign="center">{day}</Typography>
            </Box>
          ))}
        </Stack>
        {weeks.map((week, wi) => (
          <Stack key={wi} direction="row" spacing={2}>
            {week.map((day) => {
              const key = day.toISOString();
              const sc = dateMap.get(day.toDateString());
              return (
                <Card
                  key={key}
                  variant="outlined"
                  sx={{ flex: 1, cursor: sc ? 'pointer' : 'default' }}
                  onClick={() => sc && setSelected(sc)}
                >
                  <Typography level="h4">{day.getDate()}</Typography>
                  {sc && (
                    <Chip color="primary" size="sm" startDecorator={<Room />}>
                      {sc.jobs.length} jobs
                    </Chip>
                  )}
                  {sc && (
                    <Chip
                      color="primary"
                      size="sm"
                      startDecorator={<LocalShipping />}
                    >
                      {sc.vehicles.length} Vehicles
                    </Chip>
                  )}
                </Card>
              );
            })}
          </Stack>
        ))}
      </Stack>
      {selected && (
        <Modal
          open
          onClose={() => setSelected(null)}
          slotProps={{
            root: { sx: { zIndex: 2000 } },
          }}
        >
          <ModalDialog sx={{ overflowY: 'auto' }}>
            <Typography level="h4">
              Jobs on {new Date(selected.date).toLocaleDateString()}
            </Typography>
            <Table>
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Address</th>
                  <th>Workers</th>
                </tr>
              </thead>
              <tbody>
                {selected.jobs
                  .sort((a: Job, b: Job) => a.start - b.start)
                  .map((job: Job, i: number) => (
                    <tr key={i}>
                      <td>{new Date(job.start).toLocaleTimeString()}</td>
                      <td>{new Date(job.end).toLocaleTimeString()}</td>
                      <td>{`${job.street}, ${job.zip} ${job.city}`}</td>
                      <td>{job.workers}</td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </ModalDialog>
        </Modal>
      )}
    </Box>
  );
}
