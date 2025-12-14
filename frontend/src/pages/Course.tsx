import VideoModule from '@/components/modules/VideoModule';
import { getCourse } from '@/services/course.service';
import { getProgress } from '@/services/progress.service';
import { CheckCircle, PlayArrow } from '@mui/icons-material';
import { Box, Card, CardContent, Chip, CircularProgress, Container, Grid, LinearProgress, List, ListItem, ListItemButton, ListItemIcon, Stack, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const CoursePage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!courseId) {
        console.warn('⚠️ CoursePage: courseId is undefined, check your route path!');
        return;
      }
      try {
        setLoading(true);
        const courseRes = await getCourse(courseId);
        setCourse(courseRes.course);

        // Select first module by default
        if (courseRes.course?.levels?.[0]?.modules?.[0]) {
          setSelectedModule(courseRes.course.levels[0].modules[0]);
        }

        const progressRes = await getProgress(courseId);
        setProgress(progressRes.progress);
      } catch (err: any) {
        console.error('Error loading course or progress', err);
        setError(err.response?.data?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const refreshProgress = async () => {
    if (!courseId) return;
    try {
      const updated = await getProgress(courseId);
      setProgress(updated.progress);
    } catch (err) {
      console.error('Error refreshing progress', err);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;
  if (error) return <Typography color="error" textAlign="center" sx={{ mt: 5 }}>{error}</Typography>;
  if (!course) return <Typography textAlign="center" sx={{ mt: 5 }}>Course not found.</Typography>;

  const isModuleCompleted = (moduleId: string) =>
    progress?.levels?.some((lvl: any) => lvl.moduleProgress.some((m: any) => m.moduleId === moduleId && m.completed));

  const getTotalModules = () => {
    let count = 0;
    course.levels.forEach((l: any) => {
      count += l.modules.length;
    });
    return count;
  };

  const getCompletedModules = () => {
    let count = 0;
    progress?.levels?.forEach((lvl: any) => {
      count += lvl.moduleProgress.filter((m: any) => m.completed).length;
    });
    return count;
  };

  const totalModules = getTotalModules();
  const completedModules = getCompletedModules();
  const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 1, px: 1 }}>
      <Grid container spacing={2}>
        {/* Left Sidebar: Course Outline */}
        <Grid item xs={12} md={3}>
          <Card elevation={1} sx={{ borderRadius: 3, position: 'sticky', top: 56 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>📚 Course Content</Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Overall Progress</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <LinearProgress variant="determinate" value={overallProgress} sx={{ flex: 1 }} />
                  <Typography variant="caption" sx={{ minWidth: 45 }}>{overallProgress}%</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <Chip label={`${completedModules}/${totalModules}`} size="small" variant="outlined" />
                <Chip label="Lessons" size="small" />
              </Box>

              <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                {course.levels.map((level: any) => (
                  <Box key={level._id}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderRadius: 1, my: 1 }}>
                      {level.title}
                    </Typography>
                    {level.modules.map((module: any) => {
                      const isCompleted = isModuleCompleted(module._id);
                      const isSelected = selectedModule?._id === module._id;
                      return (
                        <ListItem
                          disablePadding
                          key={module._id}
                          onClick={() => setSelectedModule(module)}
                        >
                          <ListItemButton
                            selected={isSelected}
                            sx={{
                              bgcolor: isSelected ? 'primary.light' : 'transparent',
                              '&:hover': { bgcolor: 'action.hover' },
                              borderLeft: isSelected ? '4px solid' : 'none',
                              borderLeftColor: 'primary.main',
                              pl: 1,
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {isCompleted ? <CheckCircle fontSize="small" color="success" /> : <PlayArrow fontSize="small" />}
                            </ListItemIcon>
                            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {module.title}
                            </Typography>
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content: Video Player & Details */}
        <Grid item xs={12} md={9}>
          <Card elevation={1} sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>{course.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{course.description}</Typography>

              <Stack direction="row" spacing={1}>
                <Chip label={`${completedModules}/${totalModules} completed`} color={completedModules === totalModules ? 'success' : 'default'} />
                <Chip label={`${Math.round(progress?.totalWatchTime / 60 || 0)} mins watched`} />
              </Stack>
            </CardContent>
          </Card>

          {selectedModule && (
            <Card elevation={1} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>{selectedModule.title}</Typography>
                {selectedModule.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selectedModule.description}</Typography>
                )}

                <Box sx={{ mb: 2, bgcolor: '#f5f5f5', borderRadius: 2, p: 2 }}>
                  <VideoModule
                    courseId={course._id}
                    moduleId={selectedModule._id}
                    content={selectedModule.content}
                    videoLength={selectedModule.videoLength}
                    codingQuestions={selectedModule.codingQuestions}
                    onComplete={refreshProgress}
                    onProgress={refreshProgress}
                  />
                </Box>

                {progress && (
                  <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Typography variant="caption" color="text.secondary">Module Progress</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {Math.round(
                            progress.levels.flatMap((l: any) => l.moduleProgress)
                              .find((m: any) => m.moduleId === selectedModule._id)?.percentWatched || 0
                          )}% watched
                        </Typography>
                      </div>
                      {isModuleCompleted(selectedModule._id) && (
                        <CheckCircle color="success" sx={{ fontSize: 32 }} />
                      )}
                    </Box>
                  </Box>
                )}

                {selectedModule.resources && selectedModule.resources.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>📎 Resources</Typography>
                    {selectedModule.resources.map((res: any, idx: number) => (
                      <Box key={idx} sx={{ mb: 1 }}>
                        <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', textDecoration: 'none' }}>
                          {res.title}
                        </a>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default CoursePage;

