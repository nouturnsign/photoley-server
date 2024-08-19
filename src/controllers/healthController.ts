import { Request, Response } from 'express';

const basicHealthCheck = async (req: Request, res: Response) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'full',
    timeStyle: 'long',
  });

  res.send({
    message: 'Operational',
    timestamp: formatter.format(new Date()),
  });
};

export { basicHealthCheck };
