import 'reflect-metadata';
import bcrypt from 'bcrypt';

import dataSource from '../data-source';
import { Candidate } from '../modules/candidates/entities/candidate.entity';
import { Company } from '../modules/companies/entities/company.entity';
import { Job } from '../modules/jobs/entities/job.entity';
import { Match, MatchDecision } from '../modules/matches/entities/match.entity';
import { User, UserRole } from '../modules/users/entities/user.entity';

async function seed() {
  await dataSource.initialize();

  const users = dataSource.getRepository(User);
  const companies = dataSource.getRepository(Company);
  const jobs = dataSource.getRepository(Job);
  const candidates = dataSource.getRepository(Candidate);
  const matches = dataSource.getRepository(Match);

  // Clean old data to make seed repeatable
  await dataSource.query('TRUNCATE TABLE "messages", "conversations", "matches", "resumes", "candidates", "jobs", "companies", "users" RESTART IDENTITY CASCADE;');

  console.log('Database cleaned. Seeding...');

  // Create Users
  const passwordHash = await bcrypt.hash('workoudev2026', 10);

  const recruiterUser = await users.save(
    users.create({
      name: 'EzTech Recruiter',
      email: 'recruiter@workou.dev',
      passwordHash,
      role: UserRole.Recruiter
    })
  );

  const candidateLucasUser = await users.save(
    users.create({
      name: 'Lucas Martins',
      email: 'lucas@workou.dev',
      passwordHash,
      role: UserRole.Candidate
    })
  );

  const candidateJulianaUser = await users.save(
    users.create({
      name: 'Juliana Rocha',
      email: 'juliana@workou.dev',
      passwordHash,
      role: UserRole.Candidate
    })
  );

  const candidateRafaelUser = await users.save(
    users.create({
      name: 'Rafael Costa',
      email: 'rafael@workou.dev',
      passwordHash,
      role: UserRole.Candidate
    })
  );

  const candidateJoaoUser = await users.save(
    users.create({
      name: 'João Silva',
      email: 'joao@workou.dev',
      passwordHash,
      role: UserRole.Candidate
    })
  );

  // Create Companies
  const techSolutions = await companies.save(
    companies.create({
      name: 'Tech Solutions',
      document: '59.076.557/0001-59',
      industry: 'Technology',
      website: 'techsolutions.dev'
    })
  );

  const creativeHub = await companies.save(
    companies.create({
      name: 'Creative Hub',
      document: '12.345.678/0001-99',
      industry: 'Design',
      website: 'creativehub.design'
    })
  );

  const dataWay = await companies.save(
    companies.create({
      name: 'DataWay',
      document: '98.765.432/0001-11',
      industry: 'Analytics',
      website: 'dataway.io'
    })
  );

  // Create Jobs
  const jobFullStack = await jobs.save(
    jobs.create({
      title: 'Desenvolvedor Full Stack',
      description: 'Desenvolvimento de produto SaaS escalável com React, Node.js, TypeScript e AWS. Integração de APIs e otimização de performance.',
      requiredSkills: ['React', 'Node.js', 'TypeScript'],
      niceToHaveSkills: ['AWS', 'UX Design'],
      workModel: 'Remote',
      location: 'Sao Paulo, SP',
      seniority: 'Pleno',
      salaryMin: 8000,
      salaryMax: 12000,
      company: techSolutions
    })
  );

  const jobProductDesigner = await jobs.save(
    jobs.create({
      title: 'Product Designer',
      description: 'Criação de fluxos e layouts de alta fidelidade em Figma, condução de pesquisas de UX e refinamento do nosso Design System.',
      requiredSkills: ['Figma', 'UX Research', 'Design System'],
      niceToHaveSkills: ['React', 'HTML/CSS'],
      workModel: 'Hibrido',
      location: 'Rio de Janeiro, RJ',
      seniority: 'Pleno',
      salaryMin: 7000,
      salaryMax: 10000,
      company: creativeHub
    })
  );

  const jobDataAnalyst = await jobs.save(
    jobs.create({
      title: 'Analista de Dados',
      description: 'Extração, modelagem e visualização de dados comerciais e de produto usando Python, SQL e dashboards em Power BI.',
      requiredSkills: ['Python', 'SQL', 'Power BI'],
      niceToHaveSkills: ['Docker', 'AWS'],
      workModel: 'Remoto',
      location: 'Belo Horizonte, MG',
      seniority: 'Pleno',
      salaryMin: 6000,
      salaryMax: 9000,
      company: dataWay
    })
  );

  // Create Candidates
  const candidateLucas = await candidates.save(
    candidates.create({
      headline: 'Desenvolvedor Full Stack',
      location: 'Sao Paulo, SP',
      workModel: 'Remote',
      yearsExperience: 5,
      skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
      links: ['linkedin.com/in/lucasmartins', 'github.com/lucasmartins'],
      desiredSalary: 10000,
      user: candidateLucasUser
    })
  );

  const candidateJuliana = await candidates.save(
    candidates.create({
      headline: 'Product Designer',
      location: 'Remoto',
      workModel: 'Remote',
      yearsExperience: 4,
      skills: ['UX Research', 'Figma', 'Design System'],
      links: ['linkedin.com/in/julianarocha', 'behance.net/julianarocha'],
      desiredSalary: 8500,
      user: candidateJulianaUser
    })
  );

  const candidateRafael = await candidates.save(
    candidates.create({
      headline: 'Desenvolvedor Full Stack',
      location: 'Campinas, SP',
      workModel: 'Hibrido',
      yearsExperience: 2,
      skills: ['Vue.js', 'Python', 'SQL'],
      links: ['linkedin.com/in/rafaelcosta', 'github.com/rafaelcosta'],
      desiredSalary: 6500,
      user: candidateRafaelUser
    })
  );

  const candidateJoao = await candidates.save(
    candidates.create({
      headline: 'Desenvolvedor Full Stack',
      location: 'Sao Paulo, SP',
      workModel: 'Remote',
      yearsExperience: 5,
      skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
      links: ['linkedin.com/in/joaosilva', 'github.com/joaosilva'],
      desiredSalary: 11000,
      user: candidateJoaoUser
    })
  );

  // Create Matches
  // Recruiter Swiping queue for Desenvolvedor Full Stack (jobFullStack)
  await matches.save([
    matches.create({
      job: jobFullStack,
      candidate: candidateLucas,
      score: 95,
      scoreReason: 'Excelente alinhamento na stack (React/Node/TypeScript) e modelo de trabalho remoto desejado.',
      recruiterDecision: MatchDecision.Pending,
      candidateDecision: MatchDecision.Pending
    }),
    matches.create({
      job: jobFullStack,
      candidate: candidateJoao,
      score: 95,
      scoreReason: 'Domina exatamente o conjunto de tecnologias e preenche os anos de experiência exigidos.',
      recruiterDecision: MatchDecision.Pending,
      candidateDecision: MatchDecision.Pending
    }),
    matches.create({
      job: jobFullStack,
      candidate: candidateRafael,
      score: 68,
      scoreReason: 'Possui alinhamento parcial na stack de desenvolvimento, mas com menos tempo de experiência.',
      recruiterDecision: MatchDecision.Pending,
      candidateDecision: MatchDecision.Pending
    })
  ]);

  // Candidate Swiping queues
  // Lucas Martins swiping queue (other jobs)
  await matches.save([
    matches.create({
      job: jobDataAnalyst,
      candidate: candidateLucas,
      score: 72,
      scoreReason: 'Alinhamento em desenvolvimento backend (Python) e faixa salarial similar.',
      recruiterDecision: MatchDecision.Pending,
      candidateDecision: MatchDecision.Pending
    })
  ]);

  // Juliana Rocha swiping queue
  await matches.save([
    matches.create({
      job: jobProductDesigner,
      candidate: candidateJuliana,
      score: 84,
      scoreReason: 'Dominio de Figma, UX Research e Design System, correspondendo aos requisitos essenciais.',
      recruiterDecision: MatchDecision.Pending,
      candidateDecision: MatchDecision.Pending
    })
  ]);

  // João Silva swiping queue
  await matches.save([
    matches.create({
      job: jobDataAnalyst,
      candidate: candidateJoao,
      score: 72,
      scoreReason: 'Alinhamento no modelo remoto, embora a stack principal divirja.',
      recruiterDecision: MatchDecision.Pending,
      candidateDecision: MatchDecision.Pending
    })
  ]);

  console.log('Seeding completed successfully!');
  console.log('Credentials:');
  console.log('Recruiter: recruiter@workou.dev / workoudev2026');
  console.log('Candidates:');
  console.log('- lucas@workou.dev / workoudev2026');
  console.log('- juliana@workou.dev / workoudev2026');
  console.log('- rafael@workou.dev / workoudev2026');
  console.log('- joao@workou.dev / workoudev2026');

  await dataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  process.exit(1);
});
