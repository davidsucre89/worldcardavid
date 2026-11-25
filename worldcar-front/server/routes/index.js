import { Router } from 'express';

export default function createPageRouter(resolveHtml) {
  const router = Router();

  router.get(['/', '/login'], async (req, res, next) => {
    try {
      const html = await resolveHtml(req.originalUrl);
      res.type('html').send(html);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
